import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useKV } from '@github/spark/hooks'
import { 
  Package, 
  Plus, 
  Gear, 
  Key, 
  Copy,
  Download
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { GitHubApp, GitHubAppManifest } from '@/lib/githubApp'

const permissionOptions = [
  { value: 'actions', label: 'Actions' },
  { value: 'checks', label: 'Checks' },
  { value: 'contents', label: 'Contents' },
  { value: 'deployments', label: 'Deployments' },
  { value: 'issues', label: 'Issues' },
  { value: 'pullRequests', label: 'Pull Requests' },
  { value: 'workflows', label: 'Workflows' },
  { value: 'securityEvents', label: 'Security Events' },
]

const eventOptions = [
  'push', 'pull_request', 'issues', 'issue_comment', 'pull_request_review',
  'status', 'check_run', 'check_suite', 'workflow_run', 'deployment',
  'repository', 'release', 'create', 'delete', 'fork', 'star'
]

export function GitHubAppBuilder() {
  const [apps, setApps] = useKV<GitHubApp[]>('github-apps', [])
  const [manifest, setManifest] = useState<Partial<GitHubAppManifest>>({
    name: '',
    description: '',
    url: '',
    hookAttributes: {
      url: '',
      active: true
    },
    public: false,
    defaultPermissions: {},
    defaultEvents: []
  })

  const handlePermissionChange = (permission: string, level: 'read' | 'write' | null) => {
    setManifest(prev => ({
      ...prev,
      defaultPermissions: {
        ...prev.defaultPermissions,
        [permission]: level || undefined
      }
    }))
  }

  const handleEventToggle = (event: string) => {
    setManifest(prev => {
      const currentEvents = prev.defaultEvents || []
      return {
        ...prev,
        defaultEvents: currentEvents.includes(event)
          ? currentEvents.filter(e => e !== event)
          : [...currentEvents, event]
      }
    })
  }

  const handleCreateManifest = () => {
    const fullManifest = {
      ...manifest,
      defaultEvents: manifest.defaultEvents || []
    }
    const manifestJson = JSON.stringify(fullManifest, null, 2)
    navigator.clipboard.writeText(manifestJson)
    toast.success('Manifest copied to clipboard')
  }

  const handleGenerateApp = () => {
    if (!manifest.name || !manifest.url) {
      toast.error('Please provide app name and URL')
      return
    }

    const newApp: GitHubApp = {
      id: `app_${Date.now()}`,
      slug: manifest.name.toLowerCase().replace(/\s+/g, '-'),
      nodeId: `node_${Date.now()}`,
      owner: {
        login: 'your-org',
        id: Date.now(),
        avatarUrl: '',
        type: 'Organization'
      },
      name: manifest.name,
      description: manifest.description || '',
      externalUrl: manifest.url,
      htmlUrl: `https://github.com/apps/${manifest.name.toLowerCase().replace(/\s+/g, '-')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: manifest.defaultPermissions || {},
      events: manifest.defaultEvents || [],
      clientId: `Iv1.${Math.random().toString(36).substring(7)}`,
    }

    setApps(prev => [...prev, newApp])
    toast.success('GitHub App created successfully')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GitHub App Builder</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage GitHub Apps with custom permissions and webhooks
          </p>
        </div>
        <Button onClick={handleGenerateApp} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={16} className="mr-2" />
          Create App
        </Button>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="apps">My Apps</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card className="p-6 glow-border">
            <div className="space-y-4">
              <div>
                <Label htmlFor="app-name">App Name *</Label>
                <Input
                  id="app-name"
                  value={manifest.name}
                  onChange={(e) => setManifest({ ...manifest, name: e.target.value })}
                  placeholder="CodeOracle AI"
                />
              </div>

              <div>
                <Label htmlFor="app-description">Description</Label>
                <Textarea
                  id="app-description"
                  value={manifest.description}
                  onChange={(e) => setManifest({ ...manifest, description: e.target.value })}
                  placeholder="AI-powered code analysis and review platform"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="app-url">Homepage URL *</Label>
                <Input
                  id="app-url"
                  type="url"
                  value={manifest.url}
                  onChange={(e) => setManifest({ ...manifest, url: e.target.value })}
                  placeholder="https://your-app.com"
                />
              </div>

              <div>
                <Label htmlFor="setup-url">Setup URL (optional)</Label>
                <Input
                  id="setup-url"
                  type="url"
                  value={manifest.setupUrl || ''}
                  onChange={(e) => setManifest({ ...manifest, setupUrl: e.target.value })}
                  placeholder="https://your-app.com/setup"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public-app">Public App</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow anyone to install this app
                  </p>
                </div>
                <Switch
                  id="public-app"
                  checked={manifest.public}
                  onCheckedChange={(checked) => setManifest({ ...manifest, public: checked })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="p-6 glow-border">
            <h3 className="text-lg font-semibold mb-4">Repository Permissions</h3>
            <div className="space-y-3">
              {permissionOptions.map((perm) => (
                <div key={perm.value} className="flex items-center justify-between">
                  <Label>{perm.label}</Label>
                  <Select
                    value={(manifest.defaultPermissions?.[perm.value as keyof typeof manifest.defaultPermissions] as string) || 'none'}
                    onValueChange={(value) => 
                      handlePermissionChange(perm.value, value === 'none' ? null : value as 'read' | 'write')
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card className="p-6 glow-border">
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={manifest.hookAttributes?.url}
                  onChange={(e) => setManifest({
                    ...manifest,
                    hookAttributes: { ...manifest.hookAttributes!, url: e.target.value }
                  })}
                  placeholder="https://your-app.com/webhooks"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Active Webhooks</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable webhook delivery
                  </p>
                </div>
                <Switch
                  checked={manifest.hookAttributes?.active}
                  onCheckedChange={(checked) => setManifest({
                    ...manifest,
                    hookAttributes: { ...manifest.hookAttributes!, active: checked }
                  })}
                />
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold mb-3 block">Subscribe to Events</Label>
                <ScrollArea className="h-[300px] rounded-md border border-border p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {eventOptions.map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Switch
                          id={`event-${event}`}
                          checked={manifest.defaultEvents?.includes(event)}
                          onCheckedChange={() => handleEventToggle(event)}
                        />
                        <Label htmlFor={`event-${event}`} className="cursor-pointer text-sm">
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-muted/20">
            <div className="flex items-start gap-3">
              <Key size={20} className="text-warning mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">Webhook Secret</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Generate a secure random string for webhook signature verification
                </p>
                <Button size="sm" variant="outline" onClick={() => {
                  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                    .map(b => b.toString(16).padStart(2, '0')).join('')
                  navigator.clipboard.writeText(secret)
                  toast.success('Webhook secret copied to clipboard')
                }}>
                  <Copy size={14} className="mr-2" />
                  Generate Secret
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="apps" className="space-y-4">
          {!apps || apps.length === 0 ? (
            <Card className="p-12 text-center">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Apps Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first GitHub App to get started
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {apps.map((app) => (
                <Card key={app.id} className="p-6 glow-border hover:border-accent/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{app.name}</h3>
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{app.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Client ID:</span>
                          <span className="ml-2 font-mono">{app.clientId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Installations:</span>
                          <span className="ml-2 font-semibold">{app.installationsCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Events:</span>
                          <span className="ml-2">{app.events.length} subscribed</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-2">{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Gear size={16} />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-card/50 border-accent/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Export Manifest</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a GitHub App manifest JSON to register your app on GitHub
            </p>
            <Button onClick={handleCreateManifest} variant="outline">
              <Copy size={16} className="mr-2" />
              Copy Manifest to Clipboard
            </Button>
          </div>
          <a
            href="https://github.com/settings/apps/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Register on GitHub →
          </a>
        </div>
      </Card>
    </div>
  )
}
