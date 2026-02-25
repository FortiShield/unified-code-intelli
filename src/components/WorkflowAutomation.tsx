import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@github/spark/hooks'
import { 
  GitBranch,
  Plus,
  Lightning,
  Play,
  Pause,
  Trash,
  Gear,
  ArrowRight,
  CheckCircle,
  XCircle,
  Warning,
  Clock,
  FlowArrow,
  GitPullRequest,
  ShieldCheck,
  TestTube,
  Robot,
  Package,
  CaretRight,
  Copy,
  FloppyDisk
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { AIModelIntegration, MarketplaceApp, WorkflowAdapter } from '@/lib/githubApp'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'code-review' | 'security' | 'testing' | 'deployment' | 'custom'
  triggers: string[]
  actions: WorkflowActionConfig[]
  requiredIntegrations: {
    models: string[]
    apps: string[]
  }
}

interface WorkflowActionConfig {
  id: string
  name: string
  type: 'ai-analysis' | 'app-action' | 'webhook' | 'conditional' | 'transform'
  config: {
    modelId?: string
    appId?: string
    prompt?: string
    endpoint?: string
    method?: string
    condition?: string
    transform?: string
  }
  nextActions?: string[]
}

interface WorkflowInstance {
  id: string
  templateId?: string
  name: string
  description: string
  enabled: boolean
  triggers: {
    events: string[]
    conditions?: string[]
  }
  actions: WorkflowActionConfig[]
  connectedModels: string[]
  connectedApps: string[]
  metrics: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    averageDuration: number
  }
  lastRun?: Date
  createdAt: Date
}

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'pr-review-ai',
    name: 'AI-Powered PR Review',
    description: 'Automated code review using AI models with inline comments and suggestions',
    icon: 'GitPullRequest',
    category: 'code-review',
    triggers: ['pull_request.opened', 'pull_request.synchronize'],
    actions: [
      {
        id: 'fetch-pr-diff',
        name: 'Fetch PR Changes',
        type: 'app-action',
        config: {
          endpoint: '/api/github/pr/diff',
          method: 'GET'
        },
        nextActions: ['analyze-code']
      },
      {
        id: 'analyze-code',
        name: 'AI Code Analysis',
        type: 'ai-analysis',
        config: {
          prompt: 'Analyze this code diff for potential bugs, security issues, and code quality improvements. Provide specific line-by-line feedback.'
        },
        nextActions: ['post-review']
      },
      {
        id: 'post-review',
        name: 'Post Review Comments',
        type: 'app-action',
        config: {
          endpoint: '/api/github/pr/comment',
          method: 'POST'
        }
      }
    ],
    requiredIntegrations: {
      models: ['gpt-4o', 'claude-3-5-sonnet'],
      apps: ['github']
    }
  },
  {
    id: 'security-scan-auto',
    name: 'Automated Security Analysis',
    description: 'Scan PRs for vulnerabilities and automatically create security tickets',
    icon: 'ShieldCheck',
    category: 'security',
    triggers: ['pull_request.opened', 'push'],
    actions: [
      {
        id: 'scan-dependencies',
        name: 'Scan Dependencies',
        type: 'app-action',
        config: {
          appId: 'snyk',
          endpoint: '/api/scan'
        },
        nextActions: ['analyze-vulnerabilities']
      },
      {
        id: 'analyze-vulnerabilities',
        name: 'AI Vulnerability Analysis',
        type: 'ai-analysis',
        config: {
          prompt: 'Analyze these security findings. Prioritize by severity and potential impact. Suggest remediation steps.'
        },
        nextActions: ['create-issues']
      },
      {
        id: 'create-issues',
        name: 'Create Security Issues',
        type: 'conditional',
        config: {
          condition: 'severity >= high',
          endpoint: '/api/github/issues'
        }
      }
    ],
    requiredIntegrations: {
      models: ['gpt-4o-mini'],
      apps: ['snyk', 'github']
    }
  },
  {
    id: 'test-generation',
    name: 'AI Test Generation',
    description: 'Generate unit tests for uncovered code automatically',
    icon: 'TestTube',
    category: 'testing',
    triggers: ['pull_request.opened', 'workflow_dispatch'],
    actions: [
      {
        id: 'analyze-coverage',
        name: 'Get Coverage Report',
        type: 'app-action',
        config: {
          appId: 'codecov',
          endpoint: '/api/coverage'
        },
        nextActions: ['generate-tests']
      },
      {
        id: 'generate-tests',
        name: 'Generate Missing Tests',
        type: 'ai-analysis',
        config: {
          prompt: 'Generate comprehensive unit tests for the uncovered functions. Follow best practices and ensure edge cases are covered.'
        },
        nextActions: ['create-pr']
      },
      {
        id: 'create-pr',
        name: 'Create Test PR',
        type: 'app-action',
        config: {
          endpoint: '/api/github/pr/create',
          method: 'POST'
        }
      }
    ],
    requiredIntegrations: {
      models: ['deepseek-coder-v2'],
      apps: ['codecov', 'github']
    }
  },
  {
    id: 'refactor-assistant',
    name: 'Code Refactoring Assistant',
    description: 'Identify code smells and suggest refactoring improvements',
    icon: 'Robot',
    category: 'code-review',
    triggers: ['pull_request.opened'],
    actions: [
      {
        id: 'analyze-patterns',
        name: 'Detect Code Patterns',
        type: 'app-action',
        config: {
          appId: 'deepsource',
          endpoint: '/api/analyze'
        },
        nextActions: ['suggest-refactor']
      },
      {
        id: 'suggest-refactor',
        name: 'AI Refactoring Suggestions',
        type: 'ai-analysis',
        config: {
          prompt: 'Review the code analysis results. Suggest specific refactoring improvements with code examples.'
        },
        nextActions: ['post-suggestions']
      },
      {
        id: 'post-suggestions',
        name: 'Post Suggestions',
        type: 'app-action',
        config: {
          endpoint: '/api/github/pr/comment',
          method: 'POST'
        }
      }
    ],
    requiredIntegrations: {
      models: ['claude-3-5-sonnet'],
      apps: ['deepsource', 'sourcery', 'github']
    }
  }
]

export function WorkflowAutomation() {
  const [workflows, setWorkflows] = useKV<WorkflowInstance[]>('workflow-instances', [])
  const [connectedModels] = useKV<AIModelIntegration[]>('ai-model-integrations', [])
  const [installedApps] = useKV<string[]>('installed-marketplace-apps', [])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowInstance | null>(null)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const availableEvents = [
    'pull_request.opened',
    'pull_request.synchronize',
    'pull_request.closed',
    'push',
    'issues.opened',
    'issues.closed',
    'workflow_dispatch',
    'schedule',
    'release.published'
  ]

  const handleCreateFromTemplate = (template: WorkflowTemplate) => {
    const newWorkflow: WorkflowInstance = {
      id: `workflow_${Date.now()}`,
      templateId: template.id,
      name: template.name,
      description: template.description,
      enabled: false,
      triggers: {
        events: template.triggers
      },
      actions: template.actions,
      connectedModels: [],
      connectedApps: [],
      metrics: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageDuration: 0
      },
      createdAt: new Date()
    }

    setWorkflows(current => [...(current || []), newWorkflow])
    toast.success(`Workflow "${template.name}" created`)
    setShowCreateDialog(false)
  }

  const handleCreateCustomWorkflow = () => {
    if (!workflowName || selectedEvents.length === 0) {
      toast.error('Please provide workflow name and select at least one trigger event')
      return
    }

    const newWorkflow: WorkflowInstance = {
      id: `workflow_${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      enabled: false,
      triggers: {
        events: selectedEvents
      },
      actions: [],
      connectedModels: [],
      connectedApps: [],
      metrics: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageDuration: 0
      },
      createdAt: new Date()
    }

    setWorkflows(current => [...(current || []), newWorkflow])
    toast.success(`Custom workflow "${workflowName}" created`)
    setShowCreateDialog(false)
    setWorkflowName('')
    setWorkflowDescription('')
    setSelectedEvents([])
  }

  const handleToggleWorkflow = (id: string) => {
    setWorkflows(current =>
      (current || []).map(w =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      )
    )
    const workflow = (workflows || []).find(w => w.id === id)
    if (workflow) {
      toast.success(`Workflow ${workflow.enabled ? 'disabled' : 'enabled'}`)
    }
  }

  const handleDeleteWorkflow = (id: string) => {
    const workflow = (workflows || []).find(w => w.id === id)
    setWorkflows(current => (current || []).filter(w => w.id !== id))
    toast.success(`Workflow "${workflow?.name}" deleted`)
  }

  const handleRunWorkflow = (id: string) => {
    setWorkflows(current =>
      (current || []).map(w =>
        w.id === id
          ? {
              ...w,
              metrics: {
                ...w.metrics,
                totalRuns: w.metrics.totalRuns + 1,
                successfulRuns: w.metrics.successfulRuns + 1
              },
              lastRun: new Date()
            }
          : w
      )
    )
    const workflow = (workflows || []).find(w => w.id === id)
    toast.success(`Running workflow "${workflow?.name}"...`)
  }

  const handleDuplicateWorkflow = (id: string) => {
    const workflow = (workflows || []).find(w => w.id === id)
    if (!workflow) return

    const duplicated: WorkflowInstance = {
      ...workflow,
      id: `workflow_${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      metrics: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageDuration: 0
      },
      createdAt: new Date()
    }

    setWorkflows(current => [...(current || []), duplicated])
    toast.success(`Workflow duplicated`)
  }

  const totalRuns = (workflows || []).reduce((sum, w) => sum + w.metrics.totalRuns, 0)
  const activeWorkflows = (workflows || []).filter(w => w.enabled).length
  const avgSuccessRate = (workflows || []).length > 0
    ? (workflows || []).reduce((sum, w) => {
        const rate = w.metrics.totalRuns > 0
          ? (w.metrics.successfulRuns / w.metrics.totalRuns) * 100
          : 0
        return sum + rate
      }, 0) / (workflows || []).length
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-sm text-muted-foreground">
            Connect AI models to marketplace apps with automated workflows
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus size={16} className="mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Workflows</span>
              <GitBranch size={20} className="text-primary" />
            </div>
            <div className="text-3xl font-bold">{(workflows || []).length}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Workflows</span>
              <Lightning size={20} className="text-accent" />
            </div>
            <div className="text-3xl font-bold">{activeWorkflows}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Runs</span>
              <Play size={20} className="text-success" weight="fill" />
            </div>
            <div className="text-3xl font-bold">{totalRuns}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <CheckCircle size={20} className="text-success" weight="fill" />
            </div>
            <div className="text-3xl font-bold">{avgSuccessRate.toFixed(0)}%</div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/50">
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {!workflows || workflows.length === 0 ? (
            <Card className="p-12 text-center">
              <FlowArrow size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Workflows Created</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first workflow to automate AI-powered development tasks
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus size={16} className="mr-2" />
                Create Workflow
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map(workflow => (
                <Card key={workflow.id} className="p-6 glow-border">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold">{workflow.name}</h3>
                          <Badge
                            className={
                              workflow.enabled
                                ? 'bg-success/20 text-success border-success/30'
                                : 'bg-muted/20 text-muted-foreground border-muted/30'
                            }
                          >
                            {workflow.enabled ? (
                              <Lightning size={14} className="mr-1" weight="fill" />
                            ) : (
                              <Pause size={14} className="mr-1" weight="fill" />
                            )}
                            {workflow.enabled ? 'Active' : 'Paused'}
                          </Badge>
                          {workflow.templateId && (
                            <Badge variant="outline" className="text-xs">
                              Template
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {workflow.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {workflow.triggers.events.map((event, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs font-mono">
                              {event}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Actions:</span>
                            <span className="ml-2 font-medium">{workflow.actions.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Runs:</span>
                            <span className="ml-2 font-medium">{workflow.metrics.totalRuns}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Success:</span>
                            <span className="ml-2 font-medium text-success">
                              {workflow.metrics.successfulRuns}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Failed:</span>
                            <span className="ml-2 font-medium text-destructive">
                              {workflow.metrics.failedRuns}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Run:</span>
                            <span className="ml-2">
                              {workflow.lastRun
                                ? new Date(workflow.lastRun).toLocaleDateString()
                                : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunWorkflow(workflow.id)}
                        >
                          <Play size={16} weight="fill" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleWorkflow(workflow.id)}
                        >
                          {workflow.enabled ? (
                            <Pause size={16} weight="fill" />
                          ) : (
                            <Lightning size={16} />
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Gear size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicateWorkflow(workflow.id)}
                        >
                          <Copy size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>

                    {workflow.actions.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                            Workflow Steps
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {workflow.actions.map((action, idx) => (
                              <div key={action.id} className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-card hover:bg-accent/10 transition-colors"
                                >
                                  <span className="font-mono text-xs mr-2">{idx + 1}</span>
                                  {action.name}
                                </Badge>
                                {idx < workflow.actions.length - 1 && (
                                  <CaretRight size={16} className="text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflowTemplates.map(template => (
              <Card
                key={template.id}
                className="p-6 glow-border hover:border-accent/50 transition-all"
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        {template.icon === 'GitPullRequest' && (
                          <GitPullRequest size={20} className="text-primary" />
                        )}
                        {template.icon === 'ShieldCheck' && (
                          <ShieldCheck size={20} className="text-primary" />
                        )}
                        {template.icon === 'TestTube' && (
                          <TestTube size={20} className="text-primary" />
                        )}
                        {template.icon === 'Robot' && (
                          <Robot size={20} className="text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{template.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium">Triggers:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.triggers.map((trigger, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-mono">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground font-medium">
                        Actions: {template.actions.length} steps
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground font-medium">Required:</span>
                      <div className="flex gap-2 mt-1">
                        {template.requiredIntegrations.models.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Robot size={12} className="mr-1" />
                            {template.requiredIntegrations.models.length} AI Model
                            {template.requiredIntegrations.models.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {template.requiredIntegrations.apps.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Package size={12} className="mr-1" />
                            {template.requiredIntegrations.apps.length} App
                            {template.requiredIntegrations.apps.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <Lightning size={16} className="mr-2" />
                    Use Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 glow-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Connected AI Models</h3>
                  <Badge className="bg-accent/20 text-accent border-accent/30">
                    {(connectedModels || []).length}
                  </Badge>
                </div>

                <Separator />

                {!connectedModels || connectedModels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Robot size={32} className="mx-auto mb-2 text-muted-foreground" />
                    No AI models connected
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {connectedModels.map(model => (
                        <div
                          key={model.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{model.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {model.modelDetails.modelName}
                            </div>
                          </div>
                          <CheckCircle
                            size={18}
                            weight="fill"
                            className="text-success"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <Button variant="outline" className="w-full">
                  <Plus size={16} className="mr-2" />
                  Connect Models
                </Button>
              </div>
            </Card>

            <Card className="p-6 glow-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Installed Apps</h3>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    {(installedApps || []).length}
                  </Badge>
                </div>

                <Separator />

                {!installedApps || installedApps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Package size={32} className="mx-auto mb-2 text-muted-foreground" />
                    No apps installed
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {installedApps.map(appId => (
                        <div
                          key={appId}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">App #{appId}</div>
                            <div className="text-xs text-muted-foreground">
                              Marketplace App
                            </div>
                          </div>
                          <CheckCircle
                            size={18}
                            weight="fill"
                            className="text-success"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <Button variant="outline" className="w-full">
                  <Plus size={16} className="mr-2" />
                  Install Apps
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-muted/20">
            <h3 className="text-lg font-semibold mb-3">Integration Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {(connectedModels || []).length}
                </div>
                <div className="text-sm text-muted-foreground">AI Models</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {(installedApps || []).length}
                </div>
                <div className="text-sm text-muted-foreground">Marketplace Apps</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{activeWorkflows}</div>
                <div className="text-sm text-muted-foreground">Active Workflows</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalRuns}</div>
                <div className="text-sm text-muted-foreground">Total Executions</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Set up a custom workflow to automate your development processes
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="custom" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom">Custom Workflow</TabsTrigger>
              <TabsTrigger value="template">From Template</TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name *</Label>
                <Input
                  id="workflow-name"
                  placeholder="My Custom Workflow"
                  value={workflowName}
                  onChange={e => setWorkflowName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  placeholder="Describe what this workflow does..."
                  value={workflowDescription}
                  onChange={e => setWorkflowDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label>Trigger Events *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableEvents.map(event => (
                    <label
                      key={event}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedEvents(prev => [...prev, event])
                          } else {
                            setSelectedEvents(prev =>
                              prev.filter(ev => ev !== event)
                            )
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-mono">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleCreateCustomWorkflow}
                >
                  <FloppyDisk size={16} className="mr-2" />
                  Create Workflow
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {workflowTemplates.map(template => (
                    <Card
                      key={template.id}
                      className="p-4 glow-border hover:border-accent/50 transition-all cursor-pointer"
                      onClick={() => {
                        handleCreateFromTemplate(template)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold mb-1">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.actions.length} actions
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
