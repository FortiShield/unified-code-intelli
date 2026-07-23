import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { githubClient, type PullRequest } from '@/lib/github'
import { GitPullRequest, ArrowRight, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface GitHubPRSelectorProps {
  onSelectPR: (owner: string, repo: string, prNumber: number, pr: PullRequest) => void
}

export function GitHubPRSelector({ onSelectPR }: GitHubPRSelectorProps) {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPR, setSelectedPR] = useState<number | null>(null)

  const handleFetchPRs = async () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error('Please enter both owner and repository name')
      return
    }

    if (!githubClient.isAuthenticated()) {
      toast.error('Please connect your GitHub account first')
      return
    }

    setLoading(true)
    try {
      const prs = await githubClient.listPullRequests(owner, repo, 'all')
      setPullRequests(prs)
      if (prs.length === 0) {
        toast.info('No pull requests found in this repository')
      } else {
        toast.success(`Found ${prs.length} pull requests`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch pull requests')
      setPullRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPR = (pr: PullRequest) => {
    setSelectedPR(pr.number)
    onSelectPR(owner, repo, pr.number, pr)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/50">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <Label htmlFor="repo-owner" className="text-xs uppercase tracking-wide">
              Repository Owner
            </Label>
            <Input
              id="repo-owner"
              placeholder="facebook"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchPRs()}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repo-name" className="text-xs uppercase tracking-wide">
              Repository Name
            </Label>
            <Input
              id="repo-name"
              placeholder="react"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchPRs()}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <Button
          onClick={handleFetchPRs}
          disabled={loading}
          className="w-full glow-border-accent hover:bg-accent hover:text-accent-foreground"
        >
          <GitPullRequest size={18} weight="duotone" className="mr-2" />
          {loading ? 'Fetching PRs...' : 'Fetch Pull Requests'}
        </Button>
      </Card>

      {pullRequests.length > 0 && (
        <Card className="p-4 bg-card/50">
          <h4 className="text-sm font-medium uppercase tracking-wide mb-3">
            Select Pull Request ({pullRequests.length})
          </h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {pullRequests.map((pr) => (
                <button
                  key={pr.number}
                  onClick={() => handleSelectPR(pr)}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:border-accent/50 ${
                    selectedPR === pr.number
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{pr.number}
                        </span>
                        <Badge
                          className={
                            pr.state === 'open'
                              ? 'bg-success/20 text-success border-success/30'
                              : 'bg-primary/20 text-primary border-primary/30'
                          }
                        >
                          {pr.state}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mb-1">{pr.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{pr.user.login}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(pr.updated_at))} ago</span>
                        <span>•</span>
                        <span className="font-mono">{pr.head.ref}</span>
                        <ArrowRight size={12} />
                        <span className="font-mono">{pr.base.ref}</span>
                      </div>
                    </div>
                    {selectedPR === pr.number && (
                      <Check size={20} weight="bold" className="text-accent flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
