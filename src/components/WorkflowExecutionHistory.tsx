import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  MagnifyingGlass,
  ArrowClockwise,
  ChartLine,
  ListChecks,
  Terminal,
  Warning,
  Info,
  FunnelSimple,
  Calendar,
  Timer,
  ChartLineUp,
  Pause,
  CaretRight,
  Download
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { WorkflowExecution } from '@/lib/types'

interface WorkflowExecutionRecord extends WorkflowExecution {
  workflowName: string
  triggerSource: string
  duration?: number
}

interface ExecutionFilters {
  status: 'all' | 'running' | 'completed' | 'failed' | 'paused'
  workflowId: string
  dateRange: 'all' | 'today' | 'week' | 'month'
  searchQuery: string
}

export function WorkflowExecutionHistory() {
  const [executions, setExecutions] = useKV<WorkflowExecutionRecord[]>('workflow-executions', [])
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecutionRecord | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [filters, setFilters] = useState<ExecutionFilters>({
    status: 'all',
    workflowId: 'all',
    dateRange: 'all',
    searchQuery: ''
  })
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setExecutions(current => {
        if (!current) return []
        return current.map(exec => {
          if (exec.status === 'running') {
            const runningNodes = exec.nodeExecutions.filter(ne => ne.status === 'running')
            if (runningNodes.length > 0 && Math.random() > 0.7) {
              const completedNodeExecutions = exec.nodeExecutions.map(ne =>
                ne.status === 'running' && Math.random() > 0.5
                  ? { ...ne, status: 'completed' as const, completedAt: new Date() }
                  : ne
              )
              
              const allCompleted = completedNodeExecutions.every(ne => 
                ne.status === 'completed' || ne.status === 'skipped'
              )
              
              if (allCompleted) {
                return {
                  ...exec,
                  status: 'completed' as const,
                  completedAt: new Date(),
                  nodeExecutions: completedNodeExecutions
                }
              }
              
              return { ...exec, nodeExecutions: completedNodeExecutions }
            }
          }
          return exec
        })
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh, setExecutions])

  const filterExecutions = (executions: WorkflowExecutionRecord[]): WorkflowExecutionRecord[] => {
    return executions.filter(exec => {
      if (filters.status !== 'all' && exec.status !== filters.status) return false
      if (filters.workflowId !== 'all' && exec.workflowId !== filters.workflowId) return false
      
      if (filters.dateRange !== 'all') {
        const now = new Date()
        const execDate = new Date(exec.startedAt)
        const daysDiff = Math.floor((now.getTime() - execDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (filters.dateRange === 'today' && daysDiff > 0) return false
        if (filters.dateRange === 'week' && daysDiff > 7) return false
        if (filters.dateRange === 'month' && daysDiff > 30) return false
      }
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        return (
          exec.workflowName.toLowerCase().includes(query) ||
          exec.id.toLowerCase().includes(query) ||
          exec.triggerSource.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }

  const filteredExecutions = filterExecutions(executions || [])
  const uniqueWorkflowIds = Array.from(new Set((executions || []).map(e => e.workflowId)))

  const stats = {
    total: filteredExecutions.length,
    running: filteredExecutions.filter(e => e.status === 'running').length,
    completed: filteredExecutions.filter(e => e.status === 'completed').length,
    failed: filteredExecutions.filter(e => e.status === 'failed').length,
    avgDuration: filteredExecutions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / 
      (filteredExecutions.filter(e => e.duration).length || 1)
  }

  const handleViewDetails = (execution: WorkflowExecutionRecord) => {
    setSelectedExecution(execution)
    setShowDetailsDialog(true)
  }

  const handleRetryExecution = (executionId: string) => {
    const execution = executions?.find(e => e.id === executionId)
    if (!execution) return

    const newExecution: WorkflowExecutionRecord = {
      ...execution,
      id: `exec_${Date.now()}`,
      status: 'running',
      startedAt: new Date(),
      completedAt: undefined,
      nodeExecutions: execution.nodeExecutions.map(ne => ({
        ...ne,
        status: 'pending',
        startedAt: undefined,
        completedAt: undefined,
        error: undefined
      })),
      logs: []
    }

    setExecutions(current => [newExecution, ...(current || [])])
    toast.success('Workflow execution restarted')
  }

  const handleExportLogs = (execution: WorkflowExecutionRecord) => {
    const logsText = execution.logs
      .map(log => `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] [${log.nodeId}] ${log.message}`)
      .join('\n')
    
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${execution.id}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Logs exported')
  }

  const getStatusIcon = (status: WorkflowExecutionRecord['status']) => {
    switch (status) {
      case 'running':
        return <ChartLineUp size={16} className="text-accent animate-pulse" weight="bold" />
      case 'completed':
        return <CheckCircle size={16} className="text-success" weight="fill" />
      case 'failed':
        return <XCircle size={16} className="text-destructive" weight="fill" />
      case 'paused':
        return <Pause size={16} className="text-warning" weight="fill" />
    }
  }

  const getStatusBadgeClass = (status: WorkflowExecutionRecord['status']) => {
    switch (status) {
      case 'running':
        return 'bg-accent/20 text-accent border-accent/30'
      case 'completed':
        return 'bg-success/20 text-success border-success/30'
      case 'failed':
        return 'bg-destructive/20 text-destructive border-destructive/30'
      case 'paused':
        return 'bg-warning/20 text-warning border-warning/30'
    }
  }

  const calculateProgress = (exec: WorkflowExecutionRecord): number => {
    const total = exec.nodeExecutions.length
    const completed = exec.nodeExecutions.filter(
      ne => ne.status === 'completed' || ne.status === 'skipped' || ne.status === 'failed'
    ).length
    return (completed / total) * 100
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const getExecutionDuration = (exec: WorkflowExecutionRecord): string => {
    if (exec.duration) return formatDuration(exec.duration)
    
    const start = new Date(exec.startedAt).getTime()
    const end = exec.completedAt ? new Date(exec.completedAt).getTime() : Date.now()
    return formatDuration(end - start)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Execution History</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and analyze workflow runs in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'text-accent' : ''}
          >
            {autoRefresh ? (
              <ChartLineUp size={16} className="mr-2 animate-pulse" weight="bold" />
            ) : (
              <Pause size={16} className="mr-2" />
            )}
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExecutions(current => [...(current || [])])
              toast.success('Refreshed')
            }}
          >
            <ArrowClockwise size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Executions</span>
              <ListChecks size={20} className="text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Running</span>
              <ChartLineUp size={20} className="text-accent animate-pulse" weight="bold" />
            </div>
            <div className="text-3xl font-bold">{stats.running}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <CheckCircle size={20} className="text-success" weight="fill" />
            </div>
            <div className="text-3xl font-bold">{stats.completed}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed</span>
              <XCircle size={20} className="text-destructive" weight="fill" />
            </div>
            <div className="text-3xl font-bold">{stats.failed}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Duration</span>
              <Timer size={20} className="text-primary" />
            </div>
            <div className="text-3xl font-bold">{formatDuration(stats.avgDuration)}</div>
          </div>
        </Card>
      </div>

      <Card className="p-6 glow-border">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search executions..."
                value={filters.searchQuery}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={value =>
                setFilters(prev => ({ ...prev, status: value as ExecutionFilters['status'] }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={value =>
                setFilters(prev => ({ ...prev, dateRange: value as ExecutionFilters['dateRange'] }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.workflowId}
              onValueChange={value => setFilters(prev => ({ ...prev, workflowId: value }))}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                {uniqueWorkflowIds.map(id => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters({
                  status: 'all',
                  workflowId: 'all',
                  dateRange: 'all',
                  searchQuery: ''
                })
              }
            >
              <FunnelSimple size={16} />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glow-border">
        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-4">
            {filteredExecutions.length === 0 ? (
              <div className="text-center py-12">
                <ChartLine size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Executions Found</h3>
                <p className="text-sm text-muted-foreground">
                  {filters.status !== 'all' || filters.searchQuery
                    ? 'Try adjusting your filters'
                    : 'Workflow executions will appear here'}
                </p>
              </div>
            ) : (
              filteredExecutions.map(execution => {
                const progress = calculateProgress(execution)
                
                return (
                  <Card
                    key={execution.id}
                    className="p-6 hover:border-accent/50 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(execution)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(execution.status)}
                            <h3 className="text-lg font-bold">{execution.workflowName}</h3>
                            <Badge className={getStatusBadgeClass(execution.status)}>
                              {execution.status}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              Started {new Date(execution.startedAt).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <Timer size={14} />
                              Duration: {getExecutionDuration(execution)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Terminal size={14} />
                              Trigger: {execution.triggerSource}
                            </div>
                          </div>

                          {execution.status === 'running' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Progress: {progress.toFixed(0)}%
                                </span>
                                <span className="text-muted-foreground">
                                  {execution.nodeExecutions.filter(ne => ne.status === 'completed').length} / {execution.nodeExecutions.length} steps
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              ID: {execution.id}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {execution.nodeExecutions.length} steps
                            </Badge>
                            {execution.logs.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {execution.logs.length} logs
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {execution.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation()
                                handleRetryExecution(execution.id)
                              }}
                            >
                              <ArrowClockwise size={16} />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation()
                              handleExportLogs(execution)
                            }}
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedExecution && getStatusIcon(selectedExecution.status)}
              Execution Details
            </DialogTitle>
          </DialogHeader>

          {selectedExecution && (
            <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-auto space-y-4">
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Workflow</span>
                      <p className="font-medium">{selectedExecution.workflowName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Execution ID</span>
                      <p className="font-mono text-sm">{selectedExecution.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={getStatusBadgeClass(selectedExecution.status)}>
                        {selectedExecution.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Trigger Source</span>
                      <p className="font-medium">{selectedExecution.triggerSource}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Started At</span>
                      <p className="text-sm">{new Date(selectedExecution.startedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <p className="text-sm">{getExecutionDuration(selectedExecution)}</p>
                    </div>
                  </div>
                </Card>

                {selectedExecution.status === 'running' && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Execution Progress</h4>
                    <Progress value={calculateProgress(selectedExecution)} className="h-3 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {selectedExecution.nodeExecutions.filter(ne => ne.status === 'completed').length} of {selectedExecution.nodeExecutions.length} steps completed
                    </p>
                  </Card>
                )}

                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Execution Summary</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {selectedExecution.nodeExecutions.filter(ne => ne.status === 'pending').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">
                        {selectedExecution.nodeExecutions.filter(ne => ne.status === 'running').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Running</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {selectedExecution.nodeExecutions.filter(ne => ne.status === 'completed').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">
                        {selectedExecution.nodeExecutions.filter(ne => ne.status === 'failed').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="steps" className="flex-1 overflow-auto">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {selectedExecution.nodeExecutions.map((nodeExec, idx) => (
                      <Card key={nodeExec.nodeId} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold">{nodeExec.nodeId}</h4>
                                <Badge
                                  variant="outline"
                                  className={
                                    nodeExec.status === 'completed'
                                      ? 'text-success'
                                      : nodeExec.status === 'failed'
                                      ? 'text-destructive'
                                      : nodeExec.status === 'running'
                                      ? 'text-accent'
                                      : ''
                                  }
                                >
                                  {nodeExec.status}
                                </Badge>
                              </div>
                            </div>
                            {nodeExec.startedAt && nodeExec.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(
                                  new Date(nodeExec.completedAt).getTime() -
                                    new Date(nodeExec.startedAt).getTime()
                                )}
                              </span>
                            )}
                          </div>

                          {nodeExec.error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                              <div className="flex items-start gap-2">
                                <XCircle
                                  size={16}
                                  className="text-destructive mt-0.5"
                                  weight="fill"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-destructive mb-1">Error</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {nodeExec.error}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {nodeExec.output && (
                            <div className="p-3 rounded-lg bg-muted/20 border border-border">
                              <p className="text-xs text-muted-foreground mb-2">Output</p>
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(nodeExec.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="logs" className="flex-1 overflow-auto">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {selectedExecution.logs.length === 0 ? (
                      <div className="text-center py-12">
                        <Terminal size={48} className="mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">No logs available</p>
                      </div>
                    ) : (
                      selectedExecution.logs.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors font-mono text-xs"
                        >
                          <div className="flex items-start gap-3">
                            {log.level === 'error' && (
                              <XCircle size={16} className="text-destructive mt-0.5" weight="fill" />
                            )}
                            {log.level === 'warn' && (
                              <Warning size={16} className="text-warning mt-0.5" weight="fill" />
                            )}
                            {log.level === 'info' && (
                              <Info size={16} className="text-accent mt-0.5" weight="fill" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-primary">{log.nodeId}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    log.level === 'error'
                                      ? 'text-destructive border-destructive/30'
                                      : log.level === 'warn'
                                      ? 'text-warning border-warning/30'
                                      : 'text-accent border-accent/30'
                                  }
                                >
                                  {log.level}
                                </Badge>
                              </div>
                              <p className="text-foreground">{log.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
