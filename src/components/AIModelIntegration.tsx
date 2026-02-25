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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { 
  Robot, 
  Plus, 
  Lightning,
  CloudArrowUp,
  CheckCircle,
  XCircle,
  Warning,
  CurrencyDollar,
  ChartLine,
  Trash,
  Gear
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { AIModelIntegration } from '@/lib/githubApp'

const availableModels = [
  {
    provider: 'openai',
    modelName: 'gpt-4o',
    capabilities: ['Code Analysis', 'PR Review', 'Test Generation', 'Documentation'],
    contextWindow: 128000,
    costPerToken: { input: 0.000005, output: 0.000015 }
  },
  {
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    capabilities: ['Code Analysis', 'Quick Review', 'Code Suggestions'],
    contextWindow: 128000,
    costPerToken: { input: 0.00000015, output: 0.0000006 }
  },
  {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
    capabilities: ['Deep Code Analysis', 'Complex Refactoring', 'Architecture Review'],
    contextWindow: 200000,
    costPerToken: { input: 0.000003, output: 0.000015 }
  },
  {
    provider: 'deepseek',
    modelName: 'deepseek-coder-v2',
    capabilities: ['Code Generation', 'Bug Detection', 'Code Completion'],
    contextWindow: 64000,
    costPerToken: { input: 0.00000014, output: 0.00000028 }
  },
  {
    provider: 'google',
    modelName: 'gemini-pro',
    capabilities: ['Multi-modal Analysis', 'Document Understanding', 'Code Review'],
    contextWindow: 1000000,
    costPerToken: { input: 0.00000125, output: 0.000005 }
  },
  {
    provider: 'anthropic',
    modelName: 'claude-3-haiku',
    capabilities: ['Fast Analysis', 'Quick Responses', 'Simple Tasks'],
    contextWindow: 200000,
    costPerToken: { input: 0.00000025, output: 0.00000125 }
  }
]

export function AIModelIntegration() {
  const [connectedModels, setConnectedModels] = useKV<AIModelIntegration[]>('ai-model-integrations', [])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('')

  const handleConnectModel = () => {
    if (!selectedProvider || !selectedModel || !apiKey || !modelName) {
      toast.error('Please fill all required fields')
      return
    }

    const modelDetails = availableModels.find(
      m => m.provider === selectedProvider && m.modelName === selectedModel
    )

    if (!modelDetails) {
      toast.error('Selected model not found')
      return
    }

    const newIntegration: AIModelIntegration = {
      id: `model_${Date.now()}`,
      name: modelName,
      type: 'ai-model',
      provider: selectedProvider,
      status: 'connected',
      config: {
        apiKey,
        model: selectedModel
      },
      modelDetails: {
        ...modelDetails,
        provider: selectedProvider as any,
        version: '1.0'
      },
      usage: {
        totalTokens: 0,
        totalCost: 0,
        requestCount: 0
      },
      lastUsed: new Date()
    }

    setConnectedModels(current => [...(current || []), newIntegration])
    toast.success(`${modelName} connected successfully`)
    
    setShowAddDialog(false)
    setSelectedProvider('')
    setSelectedModel('')
    setApiKey('')
    setModelName('')
  }

  const handleDisconnectModel = (id: string) => {
    const model = (connectedModels || []).find(m => m.id === id)
    setConnectedModels(current => (current || []).filter(m => m.id !== id))
    toast.success(`${model?.name} disconnected`)
  }

  const filteredModels = availableModels.filter(m => 
    !selectedProvider || m.provider === selectedProvider
  )

  const totalUsage = (connectedModels || []).reduce((acc, model) => {
    return {
      tokens: acc.tokens + (model.usage?.totalTokens || 0),
      cost: acc.cost + (model.usage?.totalCost || 0),
      requests: acc.requests + (model.usage?.requestCount || 0)
    }
  }, { tokens: 0, cost: 0, requests: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Model Integration</h2>
          <p className="text-sm text-muted-foreground">
            Connect and manage AI models for marketplace apps and workflows
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)} 
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus size={16} className="mr-2" />
          Connect Model
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connected Models</span>
              <Robot size={20} className="text-accent" />
            </div>
            <div className="text-3xl font-bold">{(connectedModels || []).length}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Requests</span>
              <ChartLine size={20} className="text-primary" />
            </div>
            <div className="text-3xl font-bold">{totalUsage.requests.toLocaleString()}</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tokens Used</span>
              <Lightning size={20} className="text-warning" />
            </div>
            <div className="text-3xl font-bold">{(totalUsage.tokens / 1000).toFixed(1)}k</div>
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <CurrencyDollar size={20} className="text-success" />
            </div>
            <div className="text-3xl font-bold">${totalUsage.cost.toFixed(2)}</div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="connected" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/50">
          <TabsTrigger value="connected">Connected Models</TabsTrigger>
          <TabsTrigger value="available">Available Models</TabsTrigger>
          <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          {!connectedModels || connectedModels.length === 0 ? (
            <Card className="p-12 text-center">
              <Robot size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Models Connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your first AI model to power marketplace apps
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus size={16} className="mr-2" />
                Connect Model
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connectedModels.map(model => (
                <Card key={model.id} className="p-6 glow-border">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold">{model.name}</h3>
                          <Badge 
                            className={
                              model.status === 'connected' 
                                ? 'bg-success/20 text-success border-success/30' 
                                : model.status === 'error'
                                ? 'bg-destructive/20 text-destructive border-destructive/30'
                                : 'bg-muted/20 text-muted-foreground border-muted/30'
                            }
                          >
                            {model.status === 'connected' && <CheckCircle size={14} className="mr-1" weight="fill" />}
                            {model.status === 'error' && <XCircle size={14} className="mr-1" weight="fill" />}
                            {model.status === 'disconnected' && <Warning size={14} className="mr-1" weight="fill" />}
                            {model.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {model.modelDetails.provider} / {model.modelDetails.modelName}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {model.modelDetails.capabilities.map((cap, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Requests:</span>
                            <span className="ml-2 font-medium">{model.usage?.requestCount.toLocaleString() || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tokens:</span>
                            <span className="ml-2 font-medium">{((model.usage?.totalTokens || 0) / 1000).toFixed(1)}k</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="ml-2 font-medium">${(model.usage?.totalCost || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Used:</span>
                            <span className="ml-2">{model.lastUsed ? new Date(model.lastUsed).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Gear size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDisconnectModel(model.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Context Window</span>
                        <span className="font-medium">{(model.modelDetails.contextWindow || 0).toLocaleString()} tokens</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost per 1M tokens</span>
                        <span className="font-medium">
                          ${((model.modelDetails.costPerToken?.input || 0) * 1000000).toFixed(2)} in / 
                          ${((model.modelDetails.costPerToken?.output || 0) * 1000000).toFixed(2)} out
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableModels.map((model, idx) => (
              <Card key={idx} className="p-6 glow-border hover:border-accent/50 transition-all">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold capitalize">{model.provider}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {model.modelName}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {model.capabilities.slice(0, 3).map((cap, cidx) => (
                        <Badge key={cidx} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Context Window</span>
                      <span className="font-medium">{(model.contextWindow / 1000).toFixed(0)}k tokens</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Input Cost</span>
                      <span className="font-medium">${(model.costPerToken.input * 1000000).toFixed(2)}/1M</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Output Cost</span>
                      <span className="font-medium">${(model.costPerToken.output * 1000000).toFixed(2)}/1M</span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => {
                      setSelectedProvider(model.provider)
                      setSelectedModel(model.modelName)
                      setShowAddDialog(true)
                    }}
                  >
                    <CloudArrowUp size={16} className="mr-2" />
                    Connect Model
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card className="p-6 glow-border">
            <h3 className="text-lg font-semibold mb-4">Usage Overview</h3>
            
            <div className="space-y-6">
              {(connectedModels || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No usage data available. Connect models to track usage.
                </div>
              ) : (
                (connectedModels || []).map(model => (
                  <div key={model.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{model.name}</h4>
                        <p className="text-sm text-muted-foreground">{model.modelDetails.modelName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${(model.usage?.totalCost || 0).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.usage?.requestCount || 0} requests
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Token Usage</span>
                        <span>{((model.usage?.totalTokens || 0) / 1000).toFixed(1)}k / {(model.modelDetails.contextWindow || 0) / 1000}k</span>
                      </div>
                      <Progress 
                        value={((model.usage?.totalTokens || 0) / (model.modelDetails.contextWindow || 1)) * 100} 
                        className="h-2"
                      />
                    </div>

                    <Separator />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 bg-muted/20">
            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">${totalUsage.cost.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Spend</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalUsage.requests.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">API Calls</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{(totalUsage.tokens / 1000000).toFixed(2)}M</div>
                <div className="text-sm text-muted-foreground">Tokens Used</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect AI Model</DialogTitle>
            <DialogDescription>
              Configure and connect a new AI model to your workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="model-name">Model Name *</Label>
              <Input
                id="model-name"
                placeholder="My GPT-4 Model"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="provider">Provider *</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">Model *</Label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                disabled={!selectedProvider}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {filteredModels.map((model, idx) => (
                    <SelectItem key={idx} value={model.modelName}>
                      {model.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && (
              <Card className="p-4 bg-muted/20">
                <div className="space-y-2 text-sm">
                  {filteredModels
                    .filter(m => m.modelName === selectedModel)
                    .map((model, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground">Context Window:</span>
                          <span className="font-medium">{(model.contextWindow / 1000).toFixed(0)}k tokens</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {model.capabilities.map((cap, cidx) => (
                            <Badge key={cidx} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            <div>
              <Label htmlFor="api-key">API Key *</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your API key is stored securely and never shared
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleConnectModel}
              >
                <CloudArrowUp size={16} className="mr-2" />
                Connect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
