import type {
  PolicyRule,
  WebhookEvent,
  PolicyViolationEvent,
  PolicyEnforcementStats,
  WebhookConfig,
  SeverityLevel,
  PolicyAction
} from './types'
import { githubClient } from './github'

const POLICY_RULES_KEY = 'policy-rules'
const WEBHOOK_EVENTS_KEY = 'webhook-events'
const VIOLATIONS_KEY = 'policy-violations'
const WEBHOOK_CONFIG_KEY = 'webhook-config'

export async function getPolicyRules(): Promise<PolicyRule[]> {
  const rules = await spark.kv.get<PolicyRule[]>(POLICY_RULES_KEY)
  return rules || getDefaultPolicyRules()
}

export async function savePolicyRule(rule: PolicyRule): Promise<void> {
  const rules = await getPolicyRules()
  const index = rules.findIndex(r => r.id === rule.id)
  
  if (index >= 0) {
    rules[index] = rule
  } else {
    rules.push(rule)
  }
  
  await spark.kv.set(POLICY_RULES_KEY, rules)
}

export async function deletePolicyRule(ruleId: string): Promise<void> {
  const rules = await getPolicyRules()
  const filtered = rules.filter(r => r.id !== ruleId)
  await spark.kv.set(POLICY_RULES_KEY, filtered)
}

export async function getWebhookEvents(): Promise<WebhookEvent[]> {
  const events = await spark.kv.get<WebhookEvent[]>(WEBHOOK_EVENTS_KEY)
  return events || []
}

export async function saveWebhookEvent(event: WebhookEvent): Promise<void> {
  const events = await getWebhookEvents()
  events.unshift(event)
  
  if (events.length > 1000) {
    events.splice(1000)
  }
  
  await spark.kv.set(WEBHOOK_EVENTS_KEY, events)
}

export async function getPolicyViolations(): Promise<PolicyViolationEvent[]> {
  const violations = await spark.kv.get<PolicyViolationEvent[]>(VIOLATIONS_KEY)
  return violations || []
}

export async function savePolicyViolation(violation: PolicyViolationEvent): Promise<void> {
  const violations = await getPolicyViolations()
  violations.unshift(violation)
  
  if (violations.length > 5000) {
    violations.splice(5000)
  }
  
  await spark.kv.set(VIOLATIONS_KEY, violations)
}

export async function resolvePolicyViolation(violationId: string): Promise<void> {
  const violations = await getPolicyViolations()
  const violation = violations.find(v => v.id === violationId)
  
  if (violation) {
    violation.resolved = true
    violation.resolvedAt = new Date()
    await spark.kv.set(VIOLATIONS_KEY, violations)
  }
}

export async function processWebhookEvent(
  eventType: string,
  payload: any
): Promise<PolicyViolationEvent[]> {
  const rules = await getPolicyRules()
  const enabledRules = rules.filter(r => r.enabled)
  const violations: PolicyViolationEvent[] = []

  const repository = payload.repository?.full_name || 'unknown'
  const sender = payload.sender?.login || 'unknown'

  const webhookEvent: WebhookEvent = {
    id: generateId(),
    eventType,
    repository,
    sender,
    payload,
    receivedAt: new Date(),
    processed: false,
    violations: []
  }

  for (const rule of enabledRules) {
    if (shouldApplyRule(rule, repository)) {
      const ruleViolations = await checkRule(rule, eventType, payload)
      violations.push(...ruleViolations)
    }
  }

  webhookEvent.violations = violations
  webhookEvent.processed = true
  await saveWebhookEvent(webhookEvent)

  for (const violation of violations) {
    await savePolicyViolation(violation)
  }

  return violations
}

async function checkRule(
  rule: PolicyRule,
  eventType: string,
  payload: any
): Promise<PolicyViolationEvent[]> {
  const violations: PolicyViolationEvent[] = []
  const repository = payload.repository?.full_name || 'unknown'

  try {
    switch (rule.type) {
      case 'branch-protection':
        if (eventType === 'push' || eventType === 'create') {
          const branchViolations = await checkBranchProtection(rule, payload)
          violations.push(...branchViolations)
        }
        break

      case 'required-reviews':
        if (eventType === 'pull_request') {
          const reviewViolations = await checkRequiredReviews(rule, payload)
          violations.push(...reviewViolations)
        }
        break

      case 'required-checks':
        if (eventType === 'pull_request' || eventType === 'check_run') {
          const checkViolations = await checkRequiredChecks(rule, payload)
          violations.push(...checkViolations)
        }
        break

      case 'commit-signing':
        if (eventType === 'push') {
          const signingViolations = await checkCommitSigning(rule, payload)
          violations.push(...signingViolations)
        }
        break

      case 'merge-strategy':
        if (eventType === 'pull_request' && payload.action === 'closed' && payload.pull_request?.merged) {
          const mergeViolations = await checkMergeStrategy(rule, payload)
          violations.push(...mergeViolations)
        }
        break

      case 'security-scanning':
        if (eventType === 'push' || eventType === 'pull_request') {
          const securityViolations = await checkSecurityScanning(rule, payload)
          violations.push(...securityViolations)
        }
        break
    }
  } catch (error) {
    console.error(`Error checking rule ${rule.name}:`, error)
  }

  return violations.map(v => ({
    ...v,
    webhookEventId: generateId(),
    ruleId: rule.id,
    ruleName: rule.name,
    repository,
    severity: rule.severity,
    autoFixAvailable: false,
    notificationSent: false,
    resolved: false,
    detectedAt: new Date()
  }))
}

async function checkBranchProtection(rule: PolicyRule, payload: any): Promise<Partial<PolicyViolationEvent>[]> {
  const violations: Partial<PolicyViolationEvent>[] = []
  const ref = payload.ref
  const branch = ref?.replace('refs/heads/', '')

  if (!branch || branch === payload.repository?.default_branch) {
    return violations
  }

  const [owner, repo] = payload.repository.full_name.split('/')
  
  try {
    const protection = await githubClient.getBranchProtection(owner, repo, branch)
    
    if (!protection && rule.conditions.requireProtection) {
      violations.push({
        id: generateId(),
        branch,
        description: `Branch "${branch}" does not have protection rules enabled`,
        remediation: 'Enable branch protection rules for this branch'
      })
    }
  } catch (error) {
    if (rule.conditions.requireProtection) {
      violations.push({
        id: generateId(),
        branch,
        description: `Branch "${branch}" does not have protection rules enabled`,
        remediation: 'Enable branch protection rules for this branch'
      })
    }
  }

  return violations
}

async function checkRequiredReviews(rule: PolicyRule, payload: any): Promise<Partial<PolicyViolationEvent>[]> {
  const violations: Partial<PolicyViolationEvent>[] = []
  const pr = payload.pull_request
  
  if (!pr) return violations

  const minReviews = rule.conditions.minimumReviewers || 1
  const requireCodeOwners = rule.conditions.requireCodeOwners || false

  if (payload.action === 'opened' || payload.action === 'ready_for_review') {
    const reviewCount = pr.requested_reviewers?.length || 0
    
    if (reviewCount < minReviews) {
      violations.push({
        id: generateId(),
        pullRequest: pr.number,
        branch: pr.head.ref,
        description: `PR #${pr.number} has ${reviewCount} reviewers, requires at least ${minReviews}`,
        remediation: `Request reviews from ${minReviews - reviewCount} more reviewer(s)`
      })
    }
  }

  return violations
}

async function checkRequiredChecks(rule: PolicyRule, payload: any): Promise<Partial<PolicyViolationEvent>[]> {
  const violations: Partial<PolicyViolationEvent>[] = []
  const pr = payload.pull_request
  
  if (!pr) return violations

  const requiredChecks: string[] = rule.conditions.requiredChecks || []
  
  if (requiredChecks.length > 0 && payload.action === 'opened') {
    violations.push({
      id: generateId(),
      pullRequest: pr.number,
      branch: pr.head.ref,
      description: `PR #${pr.number} requires status checks: ${requiredChecks.join(', ')}`,
      remediation: 'Ensure all required CI/CD checks are configured and passing'
    })
  }

  return violations
}

async function checkCommitSigning(rule: PolicyRule, payload: any): Promise<Partial<PolicyViolationEvent>[]> {
  const violations: Partial<PolicyViolationEvent>[] = []
  const commits = payload.commits || []

  for (const commit of commits) {
    if (rule.conditions.requireSigned && !commit.signature) {
      violations.push({
        id: generateId(),
        commit: commit.id,
        description: `Commit ${commit.id.substring(0, 7)} is not signed`,
        remediation: 'Configure GPG signing for commits'
      })
    }
  }

  return violations
}

async function checkMergeStrategy(rule: PolicyRule, payload: any): Promise<Partial<PolicyViolationEvent>[]> {
  const violations: Partial<PolicyViolationEvent>[] = []
  const pr = payload.pull_request

  if (!pr) return violations

  const allowedStrategies: string[] = rule.conditions.allowedStrategies || ['merge', 'squash', 'rebase']
  const mergeCommitMessage = pr.merge_commit_sha

  if (rule.conditions.requireSquash && !pr.title.startsWith('[Squash]')) {
    violations.push({
      id: generateId(),
      pullRequest: pr.number,
      description: `PR #${pr.number} was not squash merged as required by policy`,
      remediation: 'Use squash merge strategy for this repository'
    })
  }

  return violations
}

async function checkSecurityScanning(rule: PolicyRule, payload: any): Promise<Partial<PolicyViolationEvent>[]> {
  const violations: Partial<PolicyViolationEvent>[] = []
  const [owner, repo] = payload.repository.full_name.split('/')

  try {
    if (rule.conditions.requireDependabot) {
      const dependabotEnabled = payload.repository.security_and_analysis?.dependabot_security_updates?.status === 'enabled'
      
      if (!dependabotEnabled) {
        violations.push({
          id: generateId(),
          description: 'Dependabot security updates are not enabled',
          remediation: 'Enable Dependabot security updates in repository settings'
        })
      }
    }

    if (rule.conditions.requireCodeScanning) {
      const codeScanningEnabled = payload.repository.security_and_analysis?.advanced_security?.status === 'enabled'
      
      if (!codeScanningEnabled) {
        violations.push({
          id: generateId(),
          description: 'Code scanning (Advanced Security) is not enabled',
          remediation: 'Enable GitHub Advanced Security and code scanning'
        })
      }
    }
  } catch (error) {
    console.error('Error checking security scanning:', error)
  }

  return violations
}

function shouldApplyRule(rule: PolicyRule, repository: string): boolean {
  if (rule.exemptions.includes(repository)) {
    return false
  }

  if (rule.repositories.length === 0) {
    return true
  }

  return rule.repositories.some(pattern => {
    if (pattern === '*') return true
    if (pattern.endsWith('*')) {
      return repository.startsWith(pattern.slice(0, -1))
    }
    return repository === pattern
  })
}

export async function getEnforcementStats(days: number = 30): Promise<PolicyEnforcementStats> {
  const violations = await getPolicyViolations()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const recentViolations = violations.filter(v => v.detectedAt >= cutoffDate)
  const resolvedViolations = recentViolations.filter(v => v.resolved)
  const autoFixedViolations = recentViolations.filter(v => v.autoFixAvailable)
  const notificationsSent = recentViolations.filter(v => v.notificationSent)

  const ruleViolationCounts = new Map<string, { ruleId: string; ruleName: string; count: number }>()
  const repoViolationCounts = new Map<string, number>()

  for (const violation of recentViolations) {
    const ruleKey = `${violation.ruleId}:${violation.ruleName}`
    const existing = ruleViolationCounts.get(ruleKey)
    
    if (existing) {
      existing.count++
    } else {
      ruleViolationCounts.set(ruleKey, {
        ruleId: violation.ruleId,
        ruleName: violation.ruleName,
        count: 1
      })
    }

    repoViolationCounts.set(
      violation.repository,
      (repoViolationCounts.get(violation.repository) || 0) + 1
    )
  }

  const totalResolutionTime = resolvedViolations.reduce((sum, v) => {
    if (v.resolvedAt) {
      return sum + (v.resolvedAt.getTime() - v.detectedAt.getTime())
    }
    return sum
  }, 0)

  const averageResolutionTime = resolvedViolations.length > 0
    ? totalResolutionTime / resolvedViolations.length / (1000 * 60 * 60)
    : 0

  const complianceRate = recentViolations.length > 0
    ? (resolvedViolations.length / recentViolations.length) * 100
    : 100

  const violationTrend: Array<{ date: Date; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const count = recentViolations.filter(v => 
      v.detectedAt >= date && v.detectedAt < nextDate
    ).length
    
    violationTrend.push({ date, count })
  }

  return {
    totalEvents: recentViolations.length,
    violationsDetected: recentViolations.length,
    violationsResolved: resolvedViolations.length,
    autoFixesApplied: autoFixedViolations.length,
    notificationsSent: notificationsSent.length,
    averageResolutionTime,
    complianceRate,
    topViolatedRules: Array.from(ruleViolationCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    violationsByRepository: Array.from(repoViolationCounts.entries())
      .map(([repository, count]) => ({ repository, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    violationTrend
  }
}

export async function generateAutoFix(violation: PolicyViolationEvent): Promise<string | null> {
  const prompt = spark.llmPrompt`You are a GitHub policy enforcement expert. Generate a shell script or API calls to automatically fix this policy violation:

Rule: ${violation.ruleName}
Repository: ${violation.repository}
Description: ${violation.description}
Remediation: ${violation.remediation}

Provide a clear, executable fix that can be applied to resolve this violation. Return ONLY the code/commands, no explanations.`

  try {
    const fix = await spark.llm(prompt, 'gpt-4o-mini')
    return fix
  } catch (error) {
    console.error('Error generating auto-fix:', error)
    return null
  }
}

function getDefaultPolicyRules(): PolicyRule[] {
  return [
    {
      id: generateId(),
      name: 'Require Branch Protection on Main',
      description: 'Ensures the main/master branch has protection rules enabled',
      type: 'branch-protection',
      severity: 'high',
      enabled: true,
      action: 'notify',
      conditions: {
        branches: ['main', 'master'],
        requireProtection: true
      },
      repositories: [],
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      name: 'Require Code Reviews',
      description: 'All PRs must have at least one approving review',
      type: 'required-reviews',
      severity: 'high',
      enabled: true,
      action: 'notify',
      conditions: {
        minimumReviewers: 1,
        requireCodeOwners: false
      },
      repositories: [],
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      name: 'Require CI Checks',
      description: 'All PRs must pass required CI/CD checks',
      type: 'required-checks',
      severity: 'medium',
      enabled: true,
      action: 'notify',
      conditions: {
        requiredChecks: ['build', 'test', 'lint']
      },
      repositories: [],
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      name: 'Require Signed Commits',
      description: 'All commits must be signed with GPG',
      type: 'commit-signing',
      severity: 'medium',
      enabled: false,
      action: 'warn',
      conditions: {
        requireSigned: true
      },
      repositories: [],
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      name: 'Require Security Scanning',
      description: 'Dependabot and code scanning must be enabled',
      type: 'security-scanning',
      severity: 'critical',
      enabled: true,
      action: 'notify',
      conditions: {
        requireDependabot: true,
        requireCodeScanning: true
      },
      repositories: [],
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
