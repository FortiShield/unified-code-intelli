import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Stop, Terminal, Pulse } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import type { SandboxEnvironment } from '@/lib/githubApp'

export function SandboxManager() {
  const [sandboxes] = useKV<SandboxEnvironment[]>('sandboxes', [
    {
      id: 'sandbox-1',
      name: 'Development',
      type: 'development',
      status: 'running',
      app: {
        appId: 'app_123'
      },
      environment: {
        variables: {
          'NODE_ENV': 'development',
          'API_URL': 'https://api.dev.example.com'
        },
        secrets: ['GITHUB_TOKEN', 'WEBHOOK_SECRET']
      },
      webhookProxy: {
        enabled: true,
        url: 'https://smee.io/abc123',
        forwardTo: 'http://localhost:3000/webhooks'
      },
      logs: [
        {
          id: 'log-1',
          timestamp: new Date(),
          level: 'info',
          message: 'Sandbox started successfully',
          source: 'system'
        }
      ],
      createdAt: new Date()
    }
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sandbox Environments</h2>
        <p className="text-sm text-muted-foreground">
          Test and develop GitHub Apps in isolated sandbox environments with webhook forwarding
        </p>
      </div>

      <div className="grid gap-6">
        {sandboxes?.map((sandbox) => (
          <Card key={sandbox.id} className="p-6 glow-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold">{sandbox.name}</h3>
                  <Badge className={
                    sandbox.status === 'running' 
                      ? 'bg-accent/20 text-accent border-accent/30'
                      : 'bg-muted/20 text-muted-foreground'
                  }>
                    {sandbox.status === 'running' ? <Pulse size={12} weight="bold" className="mr-1 animate-pulse" /> : null}
                    {sandbox.status}
                  </Badge>
                  <Badge variant="outline">{sandbox.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">App ID: {sandbox.app.appId}</p>
              </div>
              <div className="flex gap-2">
                {sandbox.status === 'running' ? (
                  <Button size="sm" variant="outline" className="hover:border-destructive hover:text-destructive">
                    <Stop size={16} className="mr-2" />
                    Stop
                  </Button>
                ) : (
                  <Button size="sm" className="bg-accent text-accent-foreground">
                    <Play size={16} className="mr-2" />
                    Start
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-muted/20">
                <div className="mb-2 flex items-center gap-2">
                  <Terminal size={16} className="text-accent" />
                  <span className="text-sm font-medium">Environment Variables</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(sandbox.environment.variables).map(([key, value]) => (
                    <div key={key} className="text-xs font-mono">
                      <span className="text-muted-foreground">{key}=</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {sandbox.webhookProxy?.enabled && (
                <Card className="p-4 bg-muted/20">
                  <div className="mb-2 flex items-center gap-2">
                    <Terminal size={16} className="text-accent" />
                    <span className="text-sm font-medium">Webhook Proxy</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">Proxy URL:</span>
                      <div className="font-mono text-accent break-all">{sandbox.webhookProxy.url}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Forward To:</span>
                      <div className="font-mono">{sandbox.webhookProxy.forwardTo}</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Recent Logs</span>
                <Button size="sm" variant="ghost" className="text-xs">
                  View All
                </Button>
              </div>
              <ScrollArea className="h-32 rounded-md border border-border p-3 bg-black/20 font-mono text-xs">
                {sandbox.logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="mb-1">
                    <span className="text-muted-foreground">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    {' '}
                    <span className={
                      log.level === 'error' ? 'text-destructive' :
                      log.level === 'warn' ? 'text-warning' :
                      log.level === 'info' ? 'text-accent' :
                      'text-foreground'
                    }>
                      [{log.level.toUpperCase()}]
                    </span>
                    {' '}
                    <span>{log.message}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
