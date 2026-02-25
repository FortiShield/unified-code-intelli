import { useState, useRef, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  GitBranch,
  Clock,
  Globe,
  ShieldCheck,
  TestTube,
  GitCommit,
  Warning,
  GitPullRequest,
  PaperPlaneTilt,
  Rocket,
  GitMerge,
  ChatText,
  Swap,
  Funnel,
  Database,
  Play,
  FloppyDisk,
  Trash,
  Plus,
  Lightning,
  CheckCircle,
  XCircle,
  Pause,
} from '@phosphor-icons/react'
import type { Workflow, WorkflowNode, WorkflowConnection, WorkflowNodeType } from '@/lib/types'

interface NodeTemplate {
  type: WorkflowNodeType
  label: string
  category: 'trigger' | 'agent' | 'action' | 'condition' | 'data'
  icon: React.ElementType
  color: string
  description: string
  inputs: Array<{ id: string; label: string; dataType: string }>
  outputs: Array<{ id: string; label: string; dataType: string }>
  defaultConfig: Record<string, any>
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'trigger-github-event',
    label: 'GitHub Event',
    category: 'trigger',
    icon: GitBranch,
    color: 'oklch(0.75 0.20 140)',
    description: 'Triggered by GitHub webhook events',
    inputs: [],
    outputs: [{ id: 'event', label: 'Event Data', dataType: 'object' }],
    defaultConfig: { events: ['pull_request', 'push', 'issues'] },
  },
  {
    type: 'trigger-schedule',
    label: 'Schedule',
    category: 'trigger',
    icon: Clock,
    color: 'oklch(0.75 0.20 140)',
    description: 'Runs on a schedule (cron)',
    inputs: [],
    outputs: [{ id: 'trigger', label: 'Trigger Time', dataType: 'datetime' }],
    defaultConfig: { cron: '0 0 * * *' },
  },
  {
    type: 'trigger-webhook',
    label: 'Webhook',
    category: 'trigger',
    icon: Globe,
    color: 'oklch(0.75 0.20 140)',
    description: 'Triggered by custom webhook',
    inputs: [],
    outputs: [{ id: 'payload', label: 'Payload', dataType: 'object' }],
    defaultConfig: { url: '', secret: '' },
  },
  {
    type: 'agent-pr-review',
    label: 'PR Review Agent',
    category: 'agent',
    icon: GitPullRequest,
    color: 'oklch(0.35 0.15 265)',
    description: 'AI-powered PR code review',
    inputs: [{ id: 'pr', label: 'PR Data', dataType: 'object' }],
    outputs: [
      { id: 'comments', label: 'Review Comments', dataType: 'array' },
      { id: 'score', label: 'Quality Score', dataType: 'number' },
    ],
    defaultConfig: { severity: 'medium', autoFix: false },
  },
  {
    type: 'agent-security',
    label: 'Security Agent',
    category: 'agent',
    icon: ShieldCheck,
    color: 'oklch(0.35 0.15 265)',
    description: 'Security vulnerability analysis',
    inputs: [{ id: 'code', label: 'Code', dataType: 'string' }],
    outputs: [
      { id: 'findings', label: 'Security Findings', dataType: 'array' },
      { id: 'riskScore', label: 'Risk Score', dataType: 'number' },
    ],
    defaultConfig: { scanDepth: 'full', rules: 'default' },
  },
  {
    type: 'agent-coverage',
    label: 'Coverage Agent',
    category: 'agent',
    icon: TestTube,
    color: 'oklch(0.35 0.15 265)',
    description: 'Test coverage optimization',
    inputs: [{ id: 'coverage', label: 'Coverage Report', dataType: 'object' }],
    outputs: [
      { id: 'tests', label: 'Generated Tests', dataType: 'array' },
      { id: 'coverageGain', label: 'Coverage Gain', dataType: 'number' },
    ],
    defaultConfig: { threshold: 80, generateTests: true },
  },
  {
    type: 'agent-commit-message',
    label: 'Commit Message',
    category: 'agent',
    icon: GitCommit,
    color: 'oklch(0.35 0.15 265)',
    description: 'Generate commit messages',
    inputs: [{ id: 'diff', label: 'Git Diff', dataType: 'string' }],
    outputs: [{ id: 'message', label: 'Commit Message', dataType: 'string' }],
    defaultConfig: { format: 'conventional' },
  },
  {
    type: 'action-create-issue',
    label: 'Create Issue',
    category: 'action',
    icon: Warning,
    color: 'oklch(0.70 0.18 50)',
    description: 'Create GitHub issue',
    inputs: [
      { id: 'title', label: 'Title', dataType: 'string' },
      { id: 'body', label: 'Body', dataType: 'string' },
    ],
    outputs: [{ id: 'issue', label: 'Created Issue', dataType: 'object' }],
    defaultConfig: { labels: [], assignees: [] },
  },
  {
    type: 'action-notify',
    label: 'Send Notification',
    category: 'action',
    icon: PaperPlaneTilt,
    color: 'oklch(0.70 0.18 50)',
    description: 'Send notification',
    inputs: [{ id: 'message', label: 'Message', dataType: 'string' }],
    outputs: [{ id: 'sent', label: 'Sent', dataType: 'boolean' }],
    defaultConfig: { channel: 'slack', webhook: '' },
  },
  {
    type: 'action-deploy',
    label: 'Deploy',
    category: 'action',
    icon: Rocket,
    color: 'oklch(0.70 0.18 50)',
    description: 'Trigger deployment',
    inputs: [{ id: 'environment', label: 'Environment', dataType: 'string' }],
    outputs: [{ id: 'status', label: 'Deploy Status', dataType: 'string' }],
    defaultConfig: { environment: 'staging', autoRollback: true },
  },
  {
    type: 'action-merge-pr',
    label: 'Merge PR',
    category: 'action',
    icon: GitMerge,
    color: 'oklch(0.70 0.18 50)',
    description: 'Merge pull request',
    inputs: [{ id: 'pr', label: 'PR Number', dataType: 'number' }],
    outputs: [{ id: 'merged', label: 'Merge Result', dataType: 'boolean' }],
    defaultConfig: { mergeMethod: 'squash', deleteBranch: true },
  },
  {
    type: 'action-comment',
    label: 'Add Comment',
    category: 'action',
    icon: ChatText,
    color: 'oklch(0.70 0.18 50)',
    description: 'Add comment to PR/Issue',
    inputs: [
      { id: 'number', label: 'PR/Issue Number', dataType: 'number' },
      { id: 'comment', label: 'Comment', dataType: 'string' },
    ],
    outputs: [{ id: 'commentId', label: 'Comment ID', dataType: 'string' }],
    defaultConfig: {},
  },
  {
    type: 'condition-if',
    label: 'If Condition',
    category: 'condition',
    icon: Swap,
    color: 'oklch(0.65 0.24 25)',
    description: 'Conditional branching',
    inputs: [{ id: 'value', label: 'Value', dataType: 'any' }],
    outputs: [
      { id: 'true', label: 'True', dataType: 'any' },
      { id: 'false', label: 'False', dataType: 'any' },
    ],
    defaultConfig: { condition: 'equals', compareValue: '' },
  },
  {
    type: 'condition-filter',
    label: 'Filter',
    category: 'condition',
    icon: Funnel,
    color: 'oklch(0.65 0.24 25)',
    description: 'Filter array items',
    inputs: [{ id: 'items', label: 'Items', dataType: 'array' }],
    outputs: [{ id: 'filtered', label: 'Filtered Items', dataType: 'array' }],
    defaultConfig: { property: '', operator: 'equals', value: '' },
  },
  {
    type: 'data-transform',
    label: 'Transform Data',
    category: 'data',
    icon: Swap,
    color: 'oklch(0.60 0.03 265)',
    description: 'Transform data structure',
    inputs: [{ id: 'input', label: 'Input', dataType: 'any' }],
    outputs: [{ id: 'output', label: 'Output', dataType: 'any' }],
    defaultConfig: { mapping: {} },
  },
  {
    type: 'data-store',
    label: 'Store Data',
    category: 'data',
    icon: Database,
    color: 'oklch(0.60 0.03 265)',
    description: 'Store data persistently',
    inputs: [{ id: 'data', label: 'Data', dataType: 'any' }],
    outputs: [{ id: 'stored', label: 'Stored', dataType: 'boolean' }],
    defaultConfig: { key: '' },
  },
]

export function VisualWorkflowBuilder() {
  const [workflows, setWorkflows] = useKV<Workflow[]>('workflows', [])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [connections, setConnections] = useState<WorkflowConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; portId: string } | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState('New Workflow')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  const createNode = useCallback((template: NodeTemplate, position: { x: number; y: number }): WorkflowNode => {
    return {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      label: template.label,
      position,
      config: { ...template.defaultConfig },
      inputs: template.inputs.map(input => ({ ...input, type: 'input' as const })),
      outputs: template.outputs.map(output => ({ ...output, type: 'output' as const })),
      category: template.category,
    }
  }, [])

  const handleDragStart = (template: NodeTemplate) => {
    const node = createNode(template, { x: 0, y: 0 })
    setDraggedNode(node)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedNode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - canvasOffset.x) / scale
    const y = (e.clientY - rect.top - canvasOffset.y) / scale

    const newNode = { ...draggedNode, position: { x, y } }
    setNodes(prev => [...prev, newNode])
    setDraggedNode(null)
    toast.success(`Added ${newNode.label}`)
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleNodeDragStart = (node: WorkflowNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(node)
  }

  const handleNodeDrag = (nodeId: string, dx: number, dy: number) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, position: { x: node.position.x + dx, y: node.position.y + dy } }
          : node
      )
    )
  }

  const handlePortClick = (nodeId: string, portId: string, portType: 'input' | 'output') => {
    if (portType === 'output') {
      setConnectingFrom({ nodeId, portId })
    } else if (connectingFrom && connectingFrom.nodeId !== nodeId) {
      const newConnection: WorkflowConnection = {
        id: `conn-${Date.now()}`,
        sourceNodeId: connectingFrom.nodeId,
        sourcePortId: connectingFrom.portId,
        targetNodeId: nodeId,
        targetPortId: portId,
      }
      setConnections(prev => [...prev, newConnection])
      setConnectingFrom(null)
      toast.success('Nodes connected')
    }
  }

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev =>
      prev.filter(conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId)
    )
    setSelectedNode(null)
    toast.success('Node deleted')
  }

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId))
    toast.success('Connection deleted')
  }

  const handleSaveWorkflow = () => {
    if (!selectedWorkflow) {
      const newWorkflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: workflowName,
        description: workflowDescription,
        nodes,
        connections,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        successRate: 100,
      }
      setWorkflows(prev => [...(prev || []), newWorkflow])
      setSelectedWorkflow(newWorkflow)
      toast.success('Workflow created')
    } else {
      setWorkflows(prev =>
        (prev || []).map(wf =>
          wf.id === selectedWorkflow.id
            ? { ...wf, nodes, connections, name: workflowName, description: workflowDescription, updatedAt: new Date() }
            : wf
        )
      )
      toast.success('Workflow saved')
    }
  }

  const handleLoadWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setNodes(workflow.nodes)
    setConnections(workflow.connections)
    setWorkflowName(workflow.name)
    setWorkflowDescription(workflow.description)
    toast.success(`Loaded ${workflow.name}`)
  }

  const handleNewWorkflow = () => {
    setSelectedWorkflow(null)
    setNodes([])
    setConnections([])
    setWorkflowName('New Workflow')
    setWorkflowDescription('')
    toast.success('New workflow canvas')
  }

  const handleExecuteWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Add nodes to the workflow first')
      return
    }

    setIsExecuting(true)
    toast.info('Executing workflow...')

    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsExecuting(false)
    toast.success('Workflow executed successfully')
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trigger':
        return 'oklch(0.75 0.20 140)'
      case 'agent':
        return 'oklch(0.35 0.15 265)'
      case 'action':
        return 'oklch(0.70 0.18 50)'
      case 'condition':
        return 'oklch(0.65 0.24 25)'
      case 'data':
        return 'oklch(0.60 0.03 265)'
      default:
        return 'oklch(0.60 0.03 265)'
    }
  }

  const renderConnection = (connection: WorkflowConnection) => {
    const sourceNode = nodes.find(n => n.id === connection.sourceNodeId)
    const targetNode = nodes.find(n => n.id === connection.targetNodeId)
    if (!sourceNode || !targetNode) return null

    const sourceX = sourceNode.position.x + 200
    const sourceY = sourceNode.position.y + 50
    const targetX = targetNode.position.x
    const targetY = targetNode.position.y + 50

    const midX = (sourceX + targetX) / 2
    const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`

    return (
      <g key={connection.id}>
        <path
          d={path}
          stroke="oklch(0.75 0.20 140)"
          strokeWidth="2"
          fill="none"
          className="cursor-pointer hover:stroke-accent"
          onClick={() => handleDeleteConnection(connection.id)}
        />
        <circle cx={sourceX} cy={sourceY} r="4" fill="oklch(0.75 0.20 140)" />
        <circle cx={targetX} cy={targetY} r="4" fill="oklch(0.75 0.20 140)" />
      </g>
    )
  }

  const template = selectedNode ? nodeTemplates.find(t => t.type === selectedNode.type) : null

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      <Card className="w-64 p-4 flex flex-col glow-border">
        <div className="space-y-4 flex-1 flex flex-col">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Node Palette
            </h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {['trigger', 'agent', 'action', 'condition', 'data'].map(category => (
                  <div key={category}>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                      {category}s
                    </div>
                    {nodeTemplates
                      .filter(t => t.category === category)
                      .map(template => {
                        const Icon = template.icon
                        return (
                          <div
                            key={template.type}
                            draggable
                            onDragStart={() => handleDragStart(template)}
                            className="p-3 rounded-md bg-card border border-border cursor-move hover:border-accent/50 transition-all hover:scale-105 group"
                          >
                            <div className="flex items-center gap-2">
                              <Icon
                                size={20}
                                weight="duotone"
                                style={{ color: template.color }}
                                className="flex-shrink-0"
                              />
                              <span className="text-sm font-medium truncate">{template.label}</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Saved Workflows
            </h3>
            <ScrollArea className="h-40">
              <div className="space-y-1">
                {(workflows || []).map(workflow => (
                  <div
                    key={workflow.id}
                    onClick={() => handleLoadWorkflow(workflow)}
                    className={`p-2 rounded cursor-pointer text-sm hover:bg-muted/50 transition-colors ${
                      selectedWorkflow?.id === workflow.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="font-medium truncate">{workflow.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.nodes.length} nodes
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <Button onClick={handleNewWorkflow} variant="outline" className="w-full" size="sm">
            <Plus size={16} className="mr-2" />
            New Workflow
          </Button>
        </div>
      </Card>

      <div className="flex-1 flex flex-col gap-4">
        <Card className="p-4 glow-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Input
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                placeholder="Workflow name"
                className="max-w-xs"
              />
              <Badge variant="secondary">{nodes.length} nodes</Badge>
              <Badge variant="secondary">{connections.length} connections</Badge>
            </div>
            <div className="flex items-center gap-2">
              {isExecuting && (
                <div className="flex items-center gap-2 text-accent animate-pulse">
                  <Lightning size={16} weight="fill" />
                  <span className="text-sm">Executing...</span>
                </div>
              )}
              <Button onClick={handleExecuteWorkflow} disabled={isExecuting} size="sm">
                <Play size={16} className="mr-2" weight="fill" />
                Test Run
              </Button>
              <Button onClick={handleSaveWorkflow} variant="outline" size="sm">
                <FloppyDisk size={16} className="mr-2" />
                Save
              </Button>
            </div>
          </div>
        </Card>

        <Card className="flex-1 relative overflow-hidden glow-border">
          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            className="w-full h-full relative bg-[radial-gradient(circle,_oklch(0.16_0.03_265)_1px,_transparent_1px)] bg-[length:20px_20px]"
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map(renderConnection)}
            </svg>

            {nodes.map(node => {
              const template = nodeTemplates.find(t => t.type === node.type)
              if (!template) return null
              const Icon = template.icon

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: node.position.x,
                    top: node.position.y,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                  className={`w-48 bg-card border-2 rounded-lg p-3 cursor-move transition-all ${
                    selectedNode?.id === node.id ? 'border-accent shadow-lg ring-2 ring-accent/20' : 'border-border'
                  }`}
                  onMouseDown={e => handleNodeDragStart(node, e)}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={20} weight="duotone" style={{ color: template.color }} />
                      <span className="text-sm font-medium">{node.label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteNode(node.id)
                      }}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>

                  {node.inputs.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {node.inputs.map(input => (
                        <div key={input.id} className="flex items-center gap-2">
                          <div
                            onClick={e => {
                              e.stopPropagation()
                              handlePortClick(node.id, input.id, 'input')
                            }}
                            className="w-3 h-3 rounded-full bg-accent cursor-pointer hover:scale-125 transition-transform"
                          />
                          <span className="text-xs text-muted-foreground">{input.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {node.outputs.length > 0 && (
                    <div className="space-y-1">
                      {node.outputs.map(output => (
                        <div key={output.id} className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">{output.label}</span>
                          <div
                            onClick={e => {
                              e.stopPropagation()
                              handlePortClick(node.id, output.id, 'output')
                            }}
                            className={`w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform ${
                              connectingFrom?.nodeId === node.id ? 'bg-warning animate-pulse' : 'bg-primary'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3 max-w-md">
                  <GitBranch size={64} weight="duotone" className="mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold text-muted-foreground">
                    Drag nodes from the palette to get started
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Build your automation workflow by connecting triggers, agents, and actions
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {selectedNode && template && (
        <Card className="w-80 p-4 glow-border">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Node Configuration
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div style={{ color: template.color }}>
                    <template.icon size={24} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{selectedNode.label}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={selectedNode.label}
                    onChange={e =>
                      setNodes(prev =>
                        prev.map(n => (n.id === selectedNode.id ? { ...n, label: e.target.value } : n))
                      )
                    }
                    className="mt-1"
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Parameters
                  </h4>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {Object.entries(selectedNode.config).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                          {typeof value === 'boolean' ? (
                            <Select
                              value={value.toString()}
                              onValueChange={v =>
                                setNodes(prev =>
                                  prev.map(n =>
                                    n.id === selectedNode.id
                                      ? { ...n, config: { ...n.config, [key]: v === 'true' } }
                                      : n
                                  )
                                )
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : typeof value === 'number' ? (
                            <Input
                              type="number"
                              value={value}
                              onChange={e =>
                                setNodes(prev =>
                                  prev.map(n =>
                                    n.id === selectedNode.id
                                      ? { ...n, config: { ...n.config, [key]: parseInt(e.target.value) } }
                                      : n
                                  )
                                )
                              }
                              className="mt-1"
                            />
                          ) : (
                            <Input
                              value={value}
                              onChange={e =>
                                setNodes(prev =>
                                  prev.map(n =>
                                    n.id === selectedNode.id
                                      ? { ...n, config: { ...n.config, [key]: e.target.value } }
                                      : n
                                  )
                                )
                              }
                              className="mt-1"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
