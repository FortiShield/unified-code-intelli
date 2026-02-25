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
