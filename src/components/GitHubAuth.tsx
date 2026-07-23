import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { githubClient } from '@/lib/github'
import { useKV } from '@github/spark/hooks'
import { Key, Check, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function GitHubAuth() {
  const [token, setToken] = useKV<string>('github-token', '')
  const [tokenInput, setTokenInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState<{ login: string; avatar_url: string } | null>(null)

  useEffect(() => {
    if (token) {
      githubClient.setToken(token)
      verifyToken()
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const user = await githubClient.verifyAuthentication()
      setIsAuthenticated(true)
      setUserInfo(user)
    } catch (error) {
      setIsAuthenticated(false)
      setUserInfo(null)
    }
  }

  const handleConnect = async () => {
    if (!tokenInput.trim()) {
      toast.error('Please enter a GitHub token')
      return
    }

    setIsVerifying(true)
    try {
      githubClient.setToken(tokenInput)
      const user = await githubClient.verifyAuthentication()
      setToken(tokenInput)
      setIsAuthenticated(true)
      setUserInfo(user)
      setTokenInput('')
      toast.success(`Connected as ${user.login}`)
    } catch (error) {
      toast.error('Invalid GitHub token')
      setIsAuthenticated(false)
      setUserInfo(null)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisconnect = () => {
    setToken('')
    setIsAuthenticated(false)
    setUserInfo(null)
    toast.success('Disconnected from GitHub')
  }

  if (isAuthenticated && userInfo) {
    return (
      <Card className="p-4 bg-card/50 border-accent/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={userInfo.avatar_url} 
              alt={userInfo.login}
              className="w-10 h-10 rounded-full border-2 border-accent/50"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{userInfo.login}</span>
                <Badge className="bg-accent/20 text-accent border-accent/30">
                  <Check size={12} weight="bold" className="mr-1" />
                  Connected
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">GitHub authenticated</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDisconnect}
            className="hover:border-destructive hover:text-destructive"
          >
            <X size={16} className="mr-1" />
            Disconnect
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card/50 border-warning/30">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/20 border border-warning/30">
            <Key size={20} className="text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Connect GitHub</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Connect your GitHub account to fetch real repository data and PR diffs
            </p>
            <div className="space-y-2">
              <Label htmlFor="github-token" className="text-xs">
                Personal Access Token
              </Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Create a token at{' '}
                <a 
                  href="https://github.com/settings/tokens/new?scopes=repo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  github.com/settings/tokens
                </a>
                {' '}with <code className="bg-muted px-1 py-0.5 rounded text-xs">repo</code> scope
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleConnect}
          disabled={isVerifying}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isVerifying ? 'Verifying...' : 'Connect GitHub'}
        </Button>
      </div>
    </Card>
  )
}
