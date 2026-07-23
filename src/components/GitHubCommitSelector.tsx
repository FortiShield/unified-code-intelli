import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { githubClient, type Commit } from '@/lib/github'
import { GitCommit, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface GitHubCommitSelectorProps {
  onSelectCommit: (owner: string, repo: string, sha: string, commit: Commit) => void
}

export function GitHubCommitSelector({ onSelectCommit }: GitHubCommitSelectorProps) {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)

  const handleFetchCommits = async () => {
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
      const fetchedCommits = await githubClient.getCommits(owner, repo, 20)
      setCommits(fetchedCommits)
      if (fetchedCommits.length === 0) {
        toast.info('No commits found in this repository')
      } else {
        toast.success(`Found ${fetchedCommits.length} commits`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch commits')
      setCommits([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCommit = (commit: Commit) => {
    setSelectedCommit(commit.sha)
    onSelectCommit(owner, repo, commit.sha, commit)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/50">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <Label htmlFor="commit-repo-owner" className="text-xs uppercase tracking-wide">
              Repository Owner
            </Label>
            <Input
              id="commit-repo-owner"
              placeholder="facebook"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchCommits()}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commit-repo-name" className="text-xs uppercase tracking-wide">
              Repository Name
            </Label>
            <Input
              id="commit-repo-name"
              placeholder="react"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchCommits()}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <Button
          onClick={handleFetchCommits}
          disabled={loading}
          className="w-full glow-border-accent hover:bg-accent hover:text-accent-foreground"
        >
          <GitCommit size={18} weight="duotone" className="mr-2" />
          {loading ? 'Fetching Commits...' : 'Fetch Commits'}
        </Button>
      </Card>

      {commits.length > 0 && (
        <Card className="p-4 bg-card/50">
          <h4 className="text-sm font-medium uppercase tracking-wide mb-3">
            Select Commit ({commits.length})
          </h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {commits.map((commit) => (
                <button
                  key={commit.sha}
                  onClick={() => handleSelectCommit(commit)}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:border-accent/50 ${
                    selectedCommit === commit.sha
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {commit.sha.slice(0, 7)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(commit.commit.author.date))} ago
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 mb-1">
                        {commit.commit.message.split('\n')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {commit.commit.author.name}
                      </p>
                    </div>
                    {selectedCommit === commit.sha && (
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
