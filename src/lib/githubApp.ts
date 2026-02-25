export interface GitHubAppManifest {
  name: string
  description: string
  url: string
  hookAttributes: {
    url: string
    active: boolean
  }
  public: boolean
  redirectUrl?: string
  setupUrl?: string
  defaultPermissions: {
    actions?: 'read' | 'write'
    checks?: 'read' | 'write'
    contents?: 'read' | 'write'
    deployments?: 'read' | 'write'
    issues?: 'read' | 'write'
    metadata?: 'read'
    packages?: 'read' | 'write'
    pages?: 'read' | 'write'
    pullRequests?: 'read' | 'write'
    repositoryHooks?: 'read' | 'write'
    repositoryProjects?: 'read' | 'write'
    securityEvents?: 'read' | 'write'
    statuses?: 'read' | 'write'
    workflows?: 'write'
    members?: 'read' | 'write'
    organizationAdministration?: 'read' | 'write'
    organizationHooks?: 'read' | 'write'
    organizationPlan?: 'read'
    organizationProjects?: 'read' | 'write'
  }
  defaultEvents: string[]
}

export interface GitHubApp {
  id: string
  slug: string
  nodeId: string
  owner: {
    login: string
    id: number
    avatarUrl: string
    type: string
  }
  name: string
  description: string
  externalUrl: string
  htmlUrl: string
  createdAt: Date
  updatedAt: Date
  permissions: GitHubAppManifest['defaultPermissions']
  events: string[]
  installationsCount?: number
  clientId: string
  clientSecret?: string
  webhookSecret?: string
  pem?: string
}

export interface GitHubAppInstallation {
  id: number
  account: {
    login: string
    id: number
    avatarUrl: string
    type: 'User' | 'Organization'
  }
  repositorySelection: 'all' | 'selected'
  permissions: Record<string, string>
  events: string[]
  createdAt: Date
  updatedAt: Date
  suspendedAt?: Date
  suspendedBy?: string
}

export interface WorkflowAdapter {
  id: string
  name: string
  description: string
  type: 'github-actions' | 'jenkins' | 'circleci' | 'gitlab-ci' | 'azure-devops' | 'custom'
  status: 'active' | 'inactive' | 'error'
  config: {
    endpoint?: string
    authentication?: {
      type: 'token' | 'oauth' | 'app' | 'basic'
      credentials?: Record<string, string>
    }
    triggers?: string[]
    actions?: WorkflowAction[]
  }
  integrations: Integration[]
  lastSync?: Date
  metrics?: {
    runs: number
    successRate: number
    averageDuration: number
  }
}

export interface WorkflowAction {
  id: string
  name: string
  type: 'webhook' | 'api-call' | 'script' | 'ai-agent'
  config: Record<string, any>
  order: number
}

export interface Integration {
  id: string
  name: string
  type: 'ai-model' | 'tool' | 'service' | 'database'
  provider: string
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  lastUsed?: Date
}

export interface AIModelIntegration extends Integration {
  type: 'ai-model'
  modelDetails: {
    provider: 'openai' | 'anthropic' | 'deepseek' | 'google' | 'custom'
    modelName: string
    version?: string
    capabilities: string[]
    contextWindow?: number
    costPerToken?: {
      input: number
      output: number
    }
  }
  usage?: {
    totalTokens: number
    totalCost: number
    requestCount: number
  }
}

export interface MarketplaceApp {
  id: string
  slug: string
  name: string
  description: string
  category: string[]
  pricing: 'free' | 'paid' | 'freemium'
  pricingPlans?: {
    name: string
    price: number
    currency: string
    interval: 'month' | 'year'
    features: string[]
  }[]
  publisher: {
    name: string
    verified: boolean
    website?: string
  }
  screenshots: string[]
  logoUrl: string
  websiteUrl?: string
  supportUrl?: string
  privacyPolicyUrl?: string
  termsOfServiceUrl?: string
  installUrl: string
  installations: number
  rating?: number
  reviews?: number
  version: string
  lastUpdated: Date
  permissions: string[]
  events: string[]
  featured: boolean
  verified: boolean
}

export interface SandboxEnvironment {
  id: string
  name: string
  type: 'development' | 'staging' | 'testing'
  status: 'running' | 'stopped' | 'building' | 'error'
  app: {
    appId: string
    installationId?: number
  }
  repository?: {
    owner: string
    name: string
    branch: string
  }
  environment: {
    variables: Record<string, string>
    secrets: string[]
  }
  webhookProxy?: {
    enabled: boolean
    url: string
    forwardTo: string
  }
  logs: SandboxLog[]
  metrics?: {
    requests: number
    errors: number
    averageResponseTime: number
  }
  createdAt: Date
  lastActivity?: Date
}

export interface SandboxLog {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: 'app' | 'webhook' | 'system'
  metadata?: Record<string, any>
}

export interface AppAnalytics {
  appId: string
  period: {
    start: Date
    end: Date
  }
  installations: {
    total: number
    active: number
    growth: number
  }
  usage: {
    totalRequests: number
    webhookEvents: number
    apiCalls: number
    errors: number
    averageResponseTime: number
  }
  topRepositories: Array<{
    repository: string
    requests: number
  }>
  topEvents: Array<{
    event: string
    count: number
  }>
  performance: {
    uptime: number
    errorRate: number
    p95ResponseTime: number
  }
}
