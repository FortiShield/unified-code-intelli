export type AgentStatus = 'idle' | 'processing' | 'active' | 'error'

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Agent {
  id: string
  name: string
  description: string
  status: AgentStatus
  lastRun?: Date
  icon: string
}

export interface PRReviewComment {
  id: string
  line: number
  severity: SeverityLevel
  message: string
  suggestion?: string
  patch?: string
}

export interface PRReview {
  id: string
  timestamp: Date
  filesChanged: number
  linesAdded: number
  linesRemoved: number
  comments: PRReviewComment[]
  overallScore: number
}

export interface SecurityFinding {
  id: string
  severity: SeverityLevel
  category: string
  title: string
  description: string
  file: string
  line: number
  cwe?: string
  remediation?: string
}

export interface CoverageReport {
  id: string
  timestamp: Date
  overallCoverage: number
  lineCoverage: number
  branchCoverage: number
  uncoveredFunctions: UncoveredFunction[]
}

export interface UncoveredFunction {
  id: string
  name: string
  file: string
  line: number
  complexity: number
  suggestedTests?: string
}

export interface RepositoryHealth {
  overallScore: number
  doraMetrics: {
    leadTime: number
    deploymentFrequency: number
    changeFailureRate: number
    mttr: number
  }
  technicalDebt: {
    score: number
    hotspots: string[]
  }
  codeChurn: {
    highChurnModules: string[]
    averageChurn: number
  }
}

export interface SearchResult {
  id: string
  file: string
  line: number
  snippet: string
  relevanceScore: number
  context: string
}

export interface FeatureRecommendation {
  id: string
  title: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  type: 'feature' | 'refactor' | 'technical-debt'
  rationale: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  modules: string[]
}

export interface CommitMessage {
  type: 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore'
  scope?: string
  subject: string
  body?: string
}

export interface BranchProtectionRule {
  pattern: string
  requiresPullRequest: boolean
  requiredApprovingReviewCount: number
  dismissesStaleReviews: boolean
  requiresCodeOwnerReviews: boolean
  requiresStatusChecks: boolean
  requiredStatusChecks: string[]
  requiresLinearHistory: boolean
  allowsForcePushes: boolean
  allowsDeletions: boolean
  score: number
}

export interface SecurityPolicy {
  twoFactorRequired: boolean
  ssoEnabled: boolean
  dependabotEnabled: boolean
  secretScanningEnabled: boolean
  codeScanningEnabled: boolean
  vulnerabilityAlertsEnabled: boolean
  score: number
}

export interface ResourceLimits {
  actionsMinutesUsed: number
  actionsMinutesLimit: number
  packageStorageUsed: number
  packageStorageLimit: number
  cacheStorageUsed: number
  cacheStorageLimit: number
  utilizationPercentage: number
}

export interface DevSecOpsMaturity {
  cicdCoverage: number
  automatedTestingCoverage: number
  securityScanningCoverage: number
  codeReviewCoverage: number
  documentationCoverage: number
  overallScore: number
  level: 'initial' | 'managed' | 'defined' | 'quantitatively-managed' | 'optimizing'
}

export interface RepositoryScore {
  repoName: string
  owner: string
  visibility: 'public' | 'private' | 'internal'
  branchProtectionScore: number
  securityScore: number
  activityScore: number
  qualityScore: number
  devSecOpsScore: number
  overallScore: number
  stars: number
  forks: number
  contributors: number
  openIssues: number
  openPRs: number
  lastUpdated: Date
  languages: Record<string, number>
  hasCI: boolean
  hasTests: boolean
  hasSecurityPolicy: boolean
  hasDependabot: boolean
  vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export interface HighPotentialRepository {
  repoName: string
  owner: string
  potentialScore: number
  growthRate: number
  contributorGrowth: number
  communityEngagement: number
  codeQuality: number
  reasons: string[]
  recommendations: string[]
}

export interface PolicyViolation {
  repoName: string
  policyType: 'branch-protection' | 'security' | 'compliance' | 'quality'
  severity: SeverityLevel
  description: string
  remediation: string
  impact: string
}

export interface OrganizationHealth {
  organizationName: string
  totalRepositories: number
  analyzedRepositories: number
  overallHealthScore: number
  branchProtection: {
    compliantRepos: number
    totalRepos: number
    score: number
    violations: PolicyViolation[]
  }
  security: SecurityPolicy
  resourceLimits: ResourceLimits
  devSecOpsMaturity: DevSecOpsMaturity
  repositoryScores: RepositoryScore[]
  highPotentialRepos: HighPotentialRepository[]
  policyViolations: PolicyViolation[]
  recommendations: string[]
  lastAnalyzed: Date
}

export type PolicyRuleType = 
  | 'branch-protection'
  | 'required-reviews'
  | 'required-checks'
  | 'commit-signing'
  | 'merge-strategy'
  | 'file-restrictions'
  | 'security-scanning'
  | 'vulnerability-alerts'
  | 'code-owners'
  | 'pr-template'

export type PolicyAction = 'notify' | 'block' | 'auto-fix' | 'warn'

export interface PolicyRule {
  id: string
  name: string
  description: string
  type: PolicyRuleType
  severity: SeverityLevel
  enabled: boolean
  action: PolicyAction
  conditions: Record<string, any>
  repositories: string[]
  exemptions: string[]
  createdAt: Date
  updatedAt: Date
}

export interface WebhookEvent {
  id: string
  eventType: string
  repository: string
  sender: string
  payload: any
  receivedAt: Date
  processed: boolean
  violations: PolicyViolationEvent[]
}

export interface PolicyViolationEvent {
  id: string
  webhookEventId: string
  ruleId: string
  ruleName: string
  repository: string
  branch?: string
  pullRequest?: number
  commit?: string
  severity: SeverityLevel
  description: string
  remediation: string
  autoFixAvailable: boolean
  notificationSent: boolean
  resolved: boolean
  detectedAt: Date
  resolvedAt?: Date
}

export interface NotificationChannel {
  id: string
  type: 'email' | 'slack' | 'webhook' | 'github-issue'
  name: string
  enabled: boolean
  config: Record<string, any>
  severityFilter: SeverityLevel[]
}

export interface PolicyEnforcementStats {
  totalEvents: number
  violationsDetected: number
  violationsResolved: number
  autoFixesApplied: number
  notificationsSent: number
  averageResolutionTime: number
  complianceRate: number
  topViolatedRules: Array<{
    ruleId: string
    ruleName: string
    count: number
  }>
  violationsByRepository: Array<{
    repository: string
    count: number
  }>
  violationTrend: Array<{
    date: Date
    count: number
  }>
}

export interface WebhookConfig {
  id: string
  url: string
  secret: string
  events: string[]
  active: boolean
  repositories: string[]
  lastDeliveryStatus?: 'success' | 'failed'
  lastDeliveryAt?: Date
  createdAt: Date
}

export type WorkflowNodeType = 
  | 'trigger-github-event'
  | 'trigger-schedule'
  | 'trigger-webhook'
  | 'agent-pr-review'
  | 'agent-security'
  | 'agent-coverage'
  | 'agent-commit-message'
  | 'action-create-issue'
  | 'action-notify'
  | 'action-deploy'
  | 'action-merge-pr'
  | 'action-comment'
  | 'condition-if'
  | 'condition-filter'
  | 'data-transform'
  | 'data-store'

export interface WorkflowNodePosition {
  x: number
  y: number
}

export interface WorkflowNodePort {
  id: string
  type: 'input' | 'output'
  label: string
  dataType: string
}

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  label: string
  position: WorkflowNodePosition
  config: Record<string, any>
  inputs: WorkflowNodePort[]
  outputs: WorkflowNodePort[]
  category: 'trigger' | 'agent' | 'action' | 'condition' | 'data'
}

export interface WorkflowConnection {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  startedAt: Date
  completedAt?: Date
  currentNodeId?: string
  nodeExecutions: Array<{
    nodeId: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    startedAt?: Date
    completedAt?: Date
    input?: any
    output?: any
    error?: string
  }>
  logs: Array<{
    timestamp: Date
    nodeId: string
    level: 'info' | 'warn' | 'error'
    message: string
  }>
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  lastExecutedAt?: Date
  executionCount: number
  successRate: number
}
