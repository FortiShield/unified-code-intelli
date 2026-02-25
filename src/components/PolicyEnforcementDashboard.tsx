import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShieldCheck,
  Bell,
  CheckCircle,
  Warning,
  Clock,
  TrendUp,
  GitBranch,
  Eye,
  Play,
  Pause,
  Sparkle,
  Code
} from '@phosphor-icons/react'
import {
  getPolicyRules,
  savePolicyRule,
  getPolicyViolations,
  resolvePolicyViolation,
  getEnforcementStats,
  generateAutoFix,
  processWebhookEvent
} from '@/lib/policyEnforcement'
import type {
  PolicyRule,
  PolicyViolationEvent,
  PolicyEnforcementStats,
  SeverityLevel
} from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AgentStatusIndicator } from './AgentStatusIndicator'

export function PolicyEnforcementDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [rules, setRules] = useState<PolicyRule[]>([])
  const [violations, setViolations] = useState<PolicyViolationEvent[]>([])
  const [stats, setStats] = useState<PolicyEnforcementStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedViolation, setSelectedViolation] = useState<PolicyViolationEvent | null>(null)
  const [autoFix, setAutoFix] = useState<string | null>(null)
  const [isGeneratingFix, setIsGeneratingFix] = useState(false)
  
  const [simulateEventPayload, setSimulateEventPayload] = useKV<string>('policy-simulate-payload', '')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [rulesData, violationsData, statsData] = await Promise.all([
        getPolicyRules(),
        getPolicyViolations(),
        getEnforcementStats(30)
      ])
      
      setRules(rulesData)
      setViolations(violationsData.slice(0, 100))
      setStats(statsData)
    } catch (error) {
      console.error('Error loading policy data:', error)
      toast.error('Failed to load policy data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleRule = async (rule: PolicyRule) => {
    try {
      const updated = { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
      await savePolicyRule(updated)
      setRules(prevRules => prevRules.map(r => r.id === rule.id ? updated : r))
      toast.success(`Policy "${rule.name}" ${updated.enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      toast.error('Failed to update policy')
    }
  }

  const handleResolveViolation = async (violationId: string) => {
    try {
      await resolvePolicyViolation(violationId)
      setViolations(prevViolations =>
        prevViolations.map(v =>
          v.id === violationId ? { ...v, resolved: true, resolvedAt: new Date() } : v
        )
      )
      toast.success('Violation marked as resolved')
      await loadData()
    } catch (error) {
      toast.error('Failed to resolve violation')
    }
  }

  const handleGenerateAutoFix = async (violation: PolicyViolationEvent) => {
    setIsGeneratingFix(true)
    setAutoFix(null)
    
    try {
      const fix = await generateAutoFix(violation)
      setAutoFix(fix)
      
      if (fix) {
        toast.success('Auto-fix generated successfully')
      } else {
        toast.error('Could not generate auto-fix')
      }
    } catch (error) {
      toast.error('Failed to generate auto-fix')
    } finally {
      setIsGeneratingFix(false)
    }
  }

  const handleSimulateWebhook = async () => {
    if (!simulateEventPayload || !simulateEventPayload.trim()) {
      toast.error('Please enter a webhook payload')
      return
    }

    try {
      const payload = JSON.parse(simulateEventPayload)
      const eventType = payload.action ? 'pull_request' : 'push'
      
      toast.info('Processing webhook event...')
      const detectedViolations = await processWebhookEvent(eventType, payload)
      
      if (detectedViolations.length > 0) {
        toast.warning(`Detected ${detectedViolations.length} policy violation(s)`, {
          description: detectedViolations.map(v => v.description).join(', ')
        })
      } else {
        toast.success('No policy violations detected')
      }
      
      await loadData()
    } catch (error: any) {
      toast.error('Failed to process webhook', {
        description: error.message
      })
    }
  }

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive'
      case 'high':
        return 'text-warning'
      case 'medium':
        return 'text-accent'
      case 'low':
        return 'text-muted-foreground'
      default:
        return 'text-foreground'
    }
  }

  const getSeverityBadgeVariant = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin">
            <ShieldCheck size={48} weight="duotone" className="text-primary" />
          </div>
          <p className="text-muted-foreground">Loading policy enforcement data...</p>
        </div>
      </div>
    )
  }

  const unresolvedViolations = violations.filter(v => !v.resolved)
  const recentViolations = violations.slice(0, 10)

  return (
    <div className="space-y-6">
      <Card className="p-8 glow-border bg-gradient-to-br from-card to-muted/20">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-lg glow-border">
                <ShieldCheck size={32} weight="duotone" className="text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Policy Enforcement</h2>
                <p className="text-muted-foreground">
                  Automated GitHub policy monitoring with real-time webhook notifications
                </p>
              </div>
            </div>
          </div>
          <AgentStatusIndicator status={unresolvedViolations.length > 0 ? 'error' : 'active'} />
        </div>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 glow-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Active Rules
                </div>
                <Eye size={20} weight="duotone" className="text-accent" />
              </div>
              <div className="text-3xl font-bold">{rules.filter(r => r.enabled).length}</div>
              <div className="text-xs text-muted-foreground">
                of {rules.length} total rules
              </div>
            </div>
          </Card>

          <Card className="p-6 glow-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Violations (30d)
                </div>
                <Warning size={20} weight="duotone" className="text-warning" />
              </div>
              <div className="text-3xl font-bold">{stats.violationsDetected}</div>
              <div className="text-xs text-muted-foreground">
                {unresolvedViolations.length} unresolved
              </div>
            </div>
          </Card>

          <Card className="p-6 glow-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Compliance Rate
                </div>
                <CheckCircle size={20} weight="duotone" className="text-success" />
              </div>
              <div className="text-3xl font-bold">{stats.complianceRate.toFixed(1)}%</div>
              <Progress value={stats.complianceRate} className="h-1" />
            </div>
          </Card>

          <Card className="p-6 glow-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  Avg Resolution
                </div>
                <Clock size={20} weight="duotone" className="text-accent" />
              </div>
              <div className="text-3xl font-bold">
                {stats.averageResolutionTime.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.violationsResolved} resolved
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50 p-1 h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Policy Rules
          </TabsTrigger>
          <TabsTrigger value="violations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Violations
          </TabsTrigger>
          <TabsTrigger value="simulate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Simulate Webhook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 glow-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendUp size={24} weight="duotone" className="text-accent" />
                Top Violated Rules
              </h3>
              <div className="space-y-3">
                {stats?.topViolatedRules.slice(0, 5).map((rule) => (
                  <div key={rule.ruleId} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{rule.ruleName}</div>
                      <div className="text-sm text-muted-foreground">
                        {rule.count} violation{rule.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Badge variant="secondary">{rule.count}</Badge>
                  </div>
                ))}
                {(!stats?.topViolatedRules || stats.topViolatedRules.length === 0) && (
                  <div className="text-center p-6 text-muted-foreground">
                    No violations detected
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 glow-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <GitBranch size={24} weight="duotone" className="text-accent" />
                Violations by Repository
              </h3>
              <div className="space-y-3">
                {stats?.violationsByRepository.slice(0, 5).map((repo) => (
                  <div key={repo.repository} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium font-mono text-sm">{repo.repository}</div>
                      <div className="text-sm text-muted-foreground">
                        {repo.count} violation{repo.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Badge variant="secondary">{repo.count}</Badge>
                  </div>
                ))}
                {(!stats?.violationsByRepository || stats.violationsByRepository.length === 0) && (
                  <div className="text-center p-6 text-muted-foreground">
                    No violations detected
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6 glow-border">
            <h3 className="text-xl font-bold mb-4">Recent Violations</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {recentViolations.map((violation) => (
                  <div
                    key={violation.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:border-accent/50",
                      violation.resolved ? 'bg-muted/10 opacity-60' : 'bg-card'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadgeVariant(violation.severity)}>
                          {violation.severity}
                        </Badge>
                        <span className="font-medium">{violation.ruleName}</span>
                      </div>
                      {violation.resolved ? (
                        <Badge variant="outline" className="text-success border-success">
                          <CheckCircle size={14} className="mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveViolation(violation.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-muted-foreground">{violation.description}</div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-mono">{violation.repository}</span>
                        {violation.branch && <span>Branch: {violation.branch}</span>}
                        {violation.pullRequest && <span>PR #{violation.pullRequest}</span>}
                        <span>{new Date(violation.detectedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {!violation.resolved && (
                      <div className="mt-3 flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedViolation(violation)
                                setAutoFix(null)
                              }}
                            >
                              <Sparkle size={16} className="mr-1" />
                              Generate Fix
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Auto-Fix Generator</DialogTitle>
                              <DialogDescription>
                                AI-generated remediation for policy violation
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                                <div><strong>Rule:</strong> {violation.ruleName}</div>
                                <div><strong>Repository:</strong> {violation.repository}</div>
                                <div><strong>Issue:</strong> {violation.description}</div>
                                <div><strong>Remediation:</strong> {violation.remediation}</div>
                              </div>
                              
                              {!autoFix && !isGeneratingFix && (
                                <Button
                                  onClick={() => handleGenerateAutoFix(violation)}
                                  className="w-full"
                                >
                                  <Sparkle size={16} className="mr-2" />
                                  Generate Auto-Fix with AI
                                </Button>
                              )}
                              
                              {isGeneratingFix && (
                                <div className="text-center p-6">
                                  <div className="inline-block animate-spin mb-2">
                                    <Sparkle size={32} className="text-primary" />
                                  </div>
                                  <p className="text-sm text-muted-foreground">Generating fix...</p>
                                </div>
                              )}
                              
                              {autoFix && (
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Generated Fix:</div>
                                  <pre className="p-4 bg-black/50 rounded-lg overflow-x-auto text-xs font-mono">
                                    <code>{autoFix}</code>
                                  </pre>
                                  <Button
                                    onClick={() => {
                                      navigator.clipboard.writeText(autoFix)
                                      toast.success('Fix copied to clipboard')
                                    }}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    Copy to Clipboard
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ))}
                {recentViolations.length === 0 && (
                  <div className="text-center p-12 text-muted-foreground">
                    <CheckCircle size={48} weight="duotone" className="mx-auto mb-4 text-success" />
                    <p>No policy violations detected</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card className="p-6 glow-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Policy Rules Configuration</h3>
              <Button onClick={loadData} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
            
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-lg border border-border bg-card hover:border-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule)}
                        />
                        <div>
                          <div className="font-semibold">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">{rule.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant={getSeverityBadgeVariant(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Badge variant="outline">{rule.type}</Badge>
                        <Badge variant="secondary">{rule.action}</Badge>
                        {rule.repositories.length > 0 && (
                          <Badge variant="outline">
                            {rule.repositories.length} repo{rule.repositories.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.enabled ? (
                        <Play size={20} weight="fill" className="text-success" />
                      ) : (
                        <Pause size={20} weight="fill" className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-6">
          <Card className="p-6 glow-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">All Violations</h3>
              <div className="flex gap-2">
                <Badge variant="destructive">{unresolvedViolations.length} Unresolved</Badge>
                <Badge variant="secondary">{violations.length - unresolvedViolations.length} Resolved</Badge>
              </div>
            </div>
            
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      violation.resolved
                        ? 'bg-muted/10 opacity-60 border-border'
                        : 'bg-card border-border hover:border-accent/50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityBadgeVariant(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <span className="font-semibold">{violation.ruleName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{violation.description}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {violation.repository}
                          {violation.branch && ` • ${violation.branch}`}
                          {violation.pullRequest && ` • PR #${violation.pullRequest}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(violation.detectedAt).toLocaleString()}
                        </div>
                      </div>
                      {!violation.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveViolation(violation.id)}
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Resolve
                        </Button>
                      )}
                      {violation.resolved && (
                        <Badge variant="outline" className="text-success border-success">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 p-3 bg-muted/20 rounded text-sm">
                      <strong className="text-xs uppercase tracking-wide text-muted-foreground">Remediation:</strong>
                      <p className="mt-1">{violation.remediation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="simulate" className="space-y-6">
          <Card className="p-6 glow-border">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Code size={24} weight="duotone" className="text-accent" />
                  Simulate Webhook Event
                </h3>
                <p className="text-sm text-muted-foreground">
                  Test policy enforcement by simulating a GitHub webhook event. Paste a webhook payload below.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook Payload (JSON)</label>
                <textarea
                  className="w-full h-96 p-4 bg-black/50 rounded-lg font-mono text-xs border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder={`{
  "action": "opened",
  "pull_request": {
    "number": 123,
    "title": "Feature: Add new component",
    "head": { "ref": "feature-branch" },
    "requested_reviewers": []
  },
  "repository": {
    "full_name": "org/repo",
    "default_branch": "main"
  },
  "sender": { "login": "username" }
}`}
                  value={simulateEventPayload}
                  onChange={(e) => setSimulateEventPayload(e.target.value)}
                />
              </div>

              <Button onClick={handleSimulateWebhook} className="w-full">
                <Play size={16} className="mr-2" />
                Process Webhook Event
              </Button>

              <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                <div className="text-sm font-medium">Example Events:</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>• <strong>pull_request</strong> - Triggers required reviews and checks policies</div>
                  <div>• <strong>push</strong> - Triggers branch protection and commit signing policies</div>
                  <div>• <strong>create</strong> - Triggers branch protection policies</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
