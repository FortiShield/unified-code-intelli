import type {
  OrganizationHealth,
  RepositoryScore,
  BranchProtectionRule,
  SecurityPolicy,
  DevSecOpsMaturity,
  HighPotentialRepository,
  PolicyViolation,
  SeverityLevel
} from './types'
import { githubClient } from './github'

export async function analyzeOrganizationHealth(orgName: string): Promise<OrganizationHealth> {
  const repos = await githubClient.listOrgRepositories(orgName)
  const orgData = await githubClient.getOrganization(orgName)

  const repositoryScores: RepositoryScore[] = []
  const policyViolations: PolicyViolation[] = []
  
  for (const repo of repos.slice(0, 50)) {
    try {
      const score = await analyzeRepository(orgName, repo.name, repo)
      repositoryScores.push(score)
      
      const violations = identifyPolicyViolations(score)
      policyViolations.push(...violations)
    } catch (error) {
      console.error(`Error analyzing ${repo.name}:`, error)
    }
  }

  const branchProtectionStats = calculateBranchProtectionStats(repositoryScores)
  const securityPolicy = await analyzeSecurityPolicy(orgName, orgData, repositoryScores)
  const devSecOpsMaturity = calculateDevSecOpsMaturity(repositoryScores)
  const highPotentialRepos = identifyHighPotentialRepos(repositoryScores)
  const resourceLimits = await estimateResourceLimits(orgData)
  
  const overallHealthScore = calculateOverallHealthScore(
    branchProtectionStats.score,
    securityPolicy.score,
    devSecOpsMaturity.overallScore,
    resourceLimits.utilizationPercentage
  )

  return {
    organizationName: orgName,
    totalRepositories: repos.length,
    analyzedRepositories: repositoryScores.length,
    overallHealthScore,
    branchProtection: branchProtectionStats,
    security: securityPolicy,
    resourceLimits,
    devSecOpsMaturity,
    repositoryScores,
    highPotentialRepos,
    policyViolations,
    recommendations: generateRecommendations(
      branchProtectionStats,
      securityPolicy,
      devSecOpsMaturity,
      policyViolations
    ),
    lastAnalyzed: new Date()
  }
}

async function analyzeRepository(
  owner: string,
  repoName: string,
  repoData: any
): Promise<RepositoryScore> {
  const [languages, hasCI, branchProtection, vulnerabilities, contributors] = await Promise.all([
    githubClient.getRepositoryLanguages(owner, repoName).catch(() => ({})),
    githubClient.hasWorkflowFiles(owner, repoName).catch(() => false),
    githubClient.getBranchProtection(owner, repoName, repoData.default_branch).catch(() => null),
    githubClient.getVulnerabilityAlerts(owner, repoName).catch(() => []),
    githubClient.getRepositoryContributors(owner, repoName).catch(() => 0)
  ])

  const branchProtectionScore = scoreBranchProtection(branchProtection)
  const securityScore = scoreSecurityPosture(
    repoData.visibility === 'private',
    vulnerabilities,
    repoData.has_issues,
    branchProtection !== null
  )
  const activityScore = scoreActivity(
    repoData.stargazers_count,
    repoData.forks_count,
    repoData.open_issues_count,
    new Date(repoData.updated_at),
    contributors
  )
  const qualityScore = scoreQuality(
    hasCI,
    branchProtection !== null,
    repoData.has_wiki,
    repoData.description !== null
  )
  const devSecOpsScore = scoreDevSecOps(hasCI, branchProtection, vulnerabilities)

  const overallScore =
    branchProtectionScore * 0.25 +
    securityScore * 0.3 +
    activityScore * 0.15 +
    qualityScore * 0.15 +
    devSecOpsScore * 0.15

  const vulnBySeverity = categorizeVulnerabilities(vulnerabilities)

  return {
    repoName,
    owner,
    visibility: repoData.visibility || 'public',
    branchProtectionScore,
    securityScore,
    activityScore,
    qualityScore,
    devSecOpsScore,
    overallScore,
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    contributors,
    openIssues: repoData.open_issues_count || 0,
    openPRs: 0,
    lastUpdated: new Date(repoData.updated_at),
    languages,
    hasCI,
    hasTests: hasCI,
    hasSecurityPolicy: repoData.security_and_analysis?.secret_scanning?.status === 'enabled',
    hasDependabot: repoData.security_and_analysis?.dependabot_security_updates?.status === 'enabled',
    vulnerabilities: vulnBySeverity
  }
}

function scoreBranchProtection(protection: any): number {
  if (!protection) return 0

  let score = 30

  if (protection.required_pull_request_reviews) {
    score += 20
    if (protection.required_pull_request_reviews.required_approving_review_count >= 2) {
      score += 10
    }
    if (protection.required_pull_request_reviews.dismiss_stale_reviews) {
      score += 10
    }
    if (protection.required_pull_request_reviews.require_code_owner_reviews) {
      score += 10
    }
  }

  if (protection.required_status_checks) {
    score += 10
    if (protection.required_status_checks.strict) {
      score += 5
    }
  }

  if (protection.enforce_admins?.enabled) {
    score += 10
  }

  if (!protection.allow_force_pushes?.enabled) {
    score += 5
  }

  return Math.min(score, 100)
}

function scoreSecurityPosture(
  isPrivate: boolean,
  vulnerabilities: any[],
  hasIssues: boolean,
  hasBranchProtection: boolean
): number {
  let score = 50

  if (isPrivate) score += 10
  if (hasBranchProtection) score += 20
  if (hasIssues) score += 10

  const criticalVulns = vulnerabilities.filter((v: any) => v.security_advisory?.severity === 'critical').length
  const highVulns = vulnerabilities.filter((v: any) => v.security_advisory?.severity === 'high').length

  score -= criticalVulns * 15
  score -= highVulns * 5

  return Math.max(0, Math.min(score, 100))
}

function scoreActivity(
  stars: number,
  forks: number,
  openIssues: number,
  lastUpdated: Date,
  contributors: number
): number {
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
  
  let score = 50

  if (stars > 100) score += 10
  else if (stars > 50) score += 5
  
  if (forks > 20) score += 10
  else if (forks > 10) score += 5

  if (contributors > 10) score += 15
  else if (contributors > 5) score += 10
  else if (contributors > 2) score += 5

  if (daysSinceUpdate < 7) score += 15
  else if (daysSinceUpdate < 30) score += 10
  else if (daysSinceUpdate < 90) score += 5
  else if (daysSinceUpdate > 365) score -= 20

  return Math.max(0, Math.min(score, 100))
}

function scoreQuality(hasCI: boolean, hasBranchProtection: boolean, hasWiki: boolean, hasDescription: boolean): number {
  let score = 0
  
  if (hasCI) score += 40
  if (hasBranchProtection) score += 30
  if (hasWiki) score += 15
  if (hasDescription) score += 15

  return score
}

function scoreDevSecOps(hasCI: boolean, branchProtection: any, vulnerabilities: any[]): number {
  let score = 0

  if (hasCI) score += 40
  if (branchProtection) score += 30
  if (vulnerabilities.length === 0) score += 30
  else {
    const criticalCount = vulnerabilities.filter((v: any) => v.security_advisory?.severity === 'critical').length
    score += Math.max(0, 30 - criticalCount * 10)
  }

  return Math.min(score, 100)
}

function categorizeVulnerabilities(vulnerabilities: any[]) {
  const result = { critical: 0, high: 0, medium: 0, low: 0 }
  
  vulnerabilities.forEach((v: any) => {
    const severity = v.security_advisory?.severity || 'low'
    if (severity === 'critical') result.critical++
    else if (severity === 'high') result.high++
    else if (severity === 'medium') result.medium++
    else result.low++
  })

  return result
}

function calculateBranchProtectionStats(repos: RepositoryScore[]) {
  const compliantRepos = repos.filter(r => r.branchProtectionScore >= 70).length
  const violations: PolicyViolation[] = []

  repos.forEach(repo => {
    if (repo.branchProtectionScore < 70) {
      violations.push({
        repoName: repo.repoName,
        policyType: 'branch-protection',
        severity: repo.branchProtectionScore < 30 ? 'critical' : repo.branchProtectionScore < 50 ? 'high' : 'medium',
        description: `Branch protection is ${repo.branchProtectionScore < 30 ? 'not configured' : 'inadequate'}`,
        remediation: 'Enable branch protection rules with required reviews, status checks, and admin enforcement',
        impact: 'Unprotected branches allow direct commits without review, increasing risk of bugs and security issues'
      })
    }
  })

  const score = repos.length > 0 ? (compliantRepos / repos.length) * 100 : 0

  return {
    compliantRepos,
    totalRepos: repos.length,
    score,
    violations
  }
}

async function analyzeSecurityPolicy(
  orgName: string,
  orgData: any,
  repos: RepositoryScore[]
): Promise<SecurityPolicy> {
  const reposWithDependabot = repos.filter(r => r.hasDependabot).length
  const reposWithSecretScanning = repos.filter(r => r.hasSecurityPolicy).length
  
  const twoFactorRequired = orgData.two_factor_requirement_enabled || false
  const dependabotCoverage = repos.length > 0 ? reposWithDependabot / repos.length : 0
  const secretScanningCoverage = repos.length > 0 ? reposWithSecretScanning / repos.length : 0

  let score = 0
  if (twoFactorRequired) score += 30
  score += dependabotCoverage * 35
  score += secretScanningCoverage * 35

  return {
    twoFactorRequired,
    ssoEnabled: false,
    dependabotEnabled: dependabotCoverage > 0.5,
    secretScanningEnabled: secretScanningCoverage > 0.5,
    codeScanningEnabled: false,
    vulnerabilityAlertsEnabled: true,
    score
  }
}

function calculateDevSecOpsMaturity(repos: RepositoryScore[]): DevSecOpsMaturity {
  const cicdCoverage = repos.filter(r => r.hasCI).length / repos.length * 100
  const securityScanningCoverage = repos.filter(r => r.hasDependabot).length / repos.length * 100
  const codeReviewCoverage = repos.filter(r => r.branchProtectionScore >= 50).length / repos.length * 100

  const overallScore = (cicdCoverage * 0.3 + securityScanningCoverage * 0.3 + codeReviewCoverage * 0.4)

  let level: 'initial' | 'managed' | 'defined' | 'quantitatively-managed' | 'optimizing' = 'initial'
  if (overallScore >= 80) level = 'optimizing'
  else if (overallScore >= 60) level = 'quantitatively-managed'
  else if (overallScore >= 40) level = 'defined'
  else if (overallScore >= 20) level = 'managed'

  return {
    cicdCoverage,
    automatedTestingCoverage: cicdCoverage,
    securityScanningCoverage,
    codeReviewCoverage,
    documentationCoverage: 50,
    overallScore,
    level
  }
}

function identifyHighPotentialRepos(repos: RepositoryScore[]): HighPotentialRepository[] {
  return repos
    .filter(r => r.activityScore > 60 && r.stars > 10)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10)
    .map(repo => {
      const reasons: string[] = []
      if (repo.stars > 50) reasons.push('High community interest (50+ stars)')
      if (repo.contributors > 10) reasons.push('Active contributor base (10+ contributors)')
      if (repo.activityScore > 80) reasons.push('Recently active and maintained')
      if (repo.qualityScore > 70) reasons.push('High quality standards')

      const recommendations: string[] = []
      if (repo.branchProtectionScore < 70) recommendations.push('Strengthen branch protection rules')
      if (!repo.hasCI) recommendations.push('Implement CI/CD pipeline')
      if (repo.vulnerabilities.critical > 0) recommendations.push('Address critical security vulnerabilities')

      return {
        repoName: repo.repoName,
        owner: repo.owner,
        potentialScore: repo.overallScore,
        growthRate: repo.activityScore,
        contributorGrowth: repo.contributors > 5 ? 75 : 50,
        communityEngagement: Math.min((repo.stars / 100) * 100, 100),
        codeQuality: repo.qualityScore,
        reasons,
        recommendations
      }
    })
}

function identifyPolicyViolations(repo: RepositoryScore): PolicyViolation[] {
  const violations: PolicyViolation[] = []

  if (repo.vulnerabilities.critical > 0) {
    violations.push({
      repoName: repo.repoName,
      policyType: 'security',
      severity: 'critical',
      description: `${repo.vulnerabilities.critical} critical vulnerabilities detected`,
      remediation: 'Update dependencies immediately and review Dependabot alerts',
      impact: 'Critical vulnerabilities can be exploited to compromise the application'
    })
  }

  if (repo.vulnerabilities.high > 2) {
    violations.push({
      repoName: repo.repoName,
      policyType: 'security',
      severity: 'high',
      description: `${repo.vulnerabilities.high} high-severity vulnerabilities detected`,
      remediation: 'Review and patch high-severity vulnerabilities within 30 days',
      impact: 'High-severity vulnerabilities increase attack surface'
    })
  }

  if (!repo.hasCI) {
    violations.push({
      repoName: repo.repoName,
      policyType: 'quality',
      severity: 'medium',
      description: 'No CI/CD pipeline detected',
      remediation: 'Implement GitHub Actions workflow for automated testing and deployment',
      impact: 'Without CI/CD, code quality and reliability cannot be automatically verified'
    })
  }

  return violations
}

async function estimateResourceLimits(orgData: any) {
  return {
    actionsMinutesUsed: 0,
    actionsMinutesLimit: 50000,
    packageStorageUsed: 0,
    packageStorageLimit: 50000,
    cacheStorageUsed: 0,
    cacheStorageLimit: 10000,
    utilizationPercentage: 0
  }
}

function calculateOverallHealthScore(
  branchProtectionScore: number,
  securityScore: number,
  devSecOpsScore: number,
  resourceUtilization: number
): number {
  const resourceScore = Math.max(0, 100 - resourceUtilization)
  
  return (
    branchProtectionScore * 0.25 +
    securityScore * 0.35 +
    devSecOpsScore * 0.3 +
    resourceScore * 0.1
  )
}

function generateRecommendations(
  branchProtection: any,
  security: SecurityPolicy,
  devSecOps: DevSecOpsMaturity,
  violations: PolicyViolation[]
): string[] {
  const recommendations: string[] = []

  if (branchProtection.score < 70) {
    recommendations.push('Improve branch protection coverage across repositories')
  }

  if (!security.twoFactorRequired) {
    recommendations.push('Enable mandatory 2FA for all organization members')
  }

  if (security.score < 60) {
    recommendations.push('Enable Dependabot and secret scanning across all repositories')
  }

  if (devSecOps.cicdCoverage < 50) {
    recommendations.push('Increase CI/CD adoption - currently below 50% of repositories')
  }

  if (devSecOps.level === 'initial' || devSecOps.level === 'managed') {
    recommendations.push('Establish DevSecOps practices: automated testing, security scanning, and code reviews')
  }

  const criticalViolations = violations.filter(v => v.severity === 'critical')
  if (criticalViolations.length > 0) {
    recommendations.push(`Address ${criticalViolations.length} critical policy violations immediately`)
  }

  return recommendations
}
