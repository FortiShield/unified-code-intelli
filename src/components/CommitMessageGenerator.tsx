import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { GitCommit, Sparkle, Copy, Check, GithubLogo } from '@phosphor-icons/react'
import { generateCommitMessage } from '@/lib/agents'
import { githubClient, type Commit } from '@/lib/github'
import { GitHubAuth } from './GitHubAuth'
import { GitHubCommitSelector } from './GitHubCommitSelector'
import { toast } from 'sonner'
import type { CommitMessage } from '@/lib/types'

const sampleDiff = `diff --git a/src/components/UserProfile.tsx b/src/components/UserProfile.tsx
index 1234567..89abcdef 100644
--- a/src/components/UserProfile.tsx
+++ b/src/components/UserProfile.tsx
@@ -8,6 +8,7 @@ export function UserProfile({ userId }: Props) {
+  const [isEditing, setIsEditing] = useState(false)
   const [userData, setUserData] = useState<User | null>(null)
   
+  const handleEdit = () => setIsEditing(true)
@@ -25,5 +26,15 @@ export function UserProfile({ userId }: Props) {
       <h2>{userData.name}</h2>
       <p>{userData.email}</p>
+      <Button onClick={handleEdit}>Edit Profile</Button>
+      {isEditing && (
+        <EditProfileModal 
+          user={userData}
+          onSave={(data) => {
+            setUserData(data)
+            setIsEditing(false)
+          }}
+        />
+      )}
     </div>
   )`

const commitTypes = [
  { value: 'feat', label: 'feat', description: 'New feature', color: 'bg-success text-background' },
  { value: 'fix', label: 'fix', description: 'Bug fix', color: 'bg-destructive text-destructive-foreground' },
  { value: 'refactor', label: 'refactor', description: 'Code restructure', color: 'bg-primary text-primary-foreground' },
  { value: 'docs', label: 'docs', description: 'Documentation', color: 'bg-accent text-accent-foreground' },
  { value: 'test', label: 'test', description: 'Tests', color: 'bg-warning text-background' },
  { value: 'chore', label: 'chore', description: 'Maintenance', color: 'bg-muted text-muted-foreground' },
  { value: 'perf', label: 'perf', description: 'Performance', color: 'bg-accent text-accent-foreground' },
  { value: 'style', label: 'style', description: 'Formatting', color: 'bg-muted text-muted-foreground' }
]

export function CommitMessageGenerator() {
  const [diffText, setDiffText] = useState(sampleDiff)
  const [commitMessage, setCommitMessage] = useState<CommitMessage | null>(null)
  const [rawMessage, setRawMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)
  const [inputMode, setInputMode] = useState<'manual' | 'github'>('manual')

  const handleGenerate = async () => {
    if (!diffText.trim()) {
      toast.error('Please paste a git diff to analyze')
      return
    }

    setGenerating(true)
    try {
      const result = await generateCommitMessage(diffText)
      setRawMessage(result)
      
      const parsed = parseCommitMessage(result)
      setCommitMessage(parsed)
      toast.success('Commit message generated!')
    } catch (error) {
      toast.error('Failed to generate commit message')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  const parseCommitMessage = (message: string): CommitMessage => {
    const conventionalPattern = /^(feat|fix|refactor|docs|test|chore|perf|style)(?:\(([^)]+)\))?: (.+)$/
    const match = message.match(conventionalPattern)

    if (match) {
      const [, type, scope, subject] = match
      const lines = message.split('\n')
      const body = lines.slice(1).join('\n').trim()

      return {
        type: type as CommitMessage['type'],
        scope: scope || undefined,
        subject: subject.trim(),
        body: body || undefined
      }
    }

    return {
      type: 'chore',
      subject: message.split('\n')[0],
      body: message.split('\n').slice(1).join('\n').trim() || undefined
    }
  }

  const handleSelectCommit = async (owner: string, repo: string, sha: string, commit: Commit) => {
    setSelectedCommit(commit)
    setGenerating(true)
    try {
      const diff = await githubClient.getCommitDiff(owner, repo, sha)
      setDiffText(diff)
      toast.success(`Loaded commit ${sha.slice(0, 7)}`)
      
      const result = await generateCommitMessage(diff)
      setRawMessage(result)
      
      const parsed = parseCommitMessage(result)
      setCommitMessage(parsed)
      toast.success('Commit message generated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch commit diff')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (rawMessage) {
      await navigator.clipboard.writeText(rawMessage)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getTypeInfo = (type: string) => {
    return commitTypes.find(t => t.value === type) || commitTypes[5]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 glow-border">
          <GitCommit size={24} weight="duotone" className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Commit Message Generator</h2>
          <p className="text-sm text-muted-foreground">Generate conventional commit messages from diffs</p>
        </div>
      </div>

      <GitHubAuth />

      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'manual' | 'github')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-card/50">
          <TabsTrigger value="github" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <GithubLogo size={16} weight="fill" className="mr-2" />
            From GitHub
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Manual Input
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github" className="space-y-4">
          <GitHubCommitSelector onSelectCommit={handleSelectCommit} />
          {selectedCommit && (
            <Card className="p-4 bg-accent/10 border-accent/30">
              <div className="flex items-center gap-3">
                <GithubLogo size={20} weight="fill" className="text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-mono">
                    {selectedCommit.sha.slice(0, 7)} - {selectedCommit.commit.author.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedCommit.commit.message.split('\n')[0]}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card className="p-6 glow-border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground uppercase tracking-wide mb-2 block">
                  Paste Git Diff
                </label>
                <Textarea
                  id="git-diff"
                  value={diffText}
                  onChange={(e) => setDiffText(e.target.value)}
                  placeholder="Paste your git diff here..."
                  className="font-mono text-xs min-h-[200px] focus:glow-border-accent"
                  rows={10}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full glow-border-accent hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Sparkle size={18} weight="duotone" className="mr-2" />
                {generating ? 'Generating Message...' : 'Generate Commit Message'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {commitMessage && (
        <Card className="p-6 glow-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Commit Message</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="glow-border-accent"
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className={getTypeInfo(commitMessage.type).color}>
                  {commitMessage.type}
                </Badge>
                {commitMessage.scope && (
                  <Badge variant="outline" className="font-mono">
                    {commitMessage.scope}
                  </Badge>
                )}
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-accent">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Subject
                    </div>
                    <p className="text-base font-medium">{commitMessage.subject}</p>
                  </div>

                  {commitMessage.body && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Body
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{commitMessage.body}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Full Message
                </div>
                <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">{rawMessage}</pre>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 glow-border bg-gradient-to-br from-card to-muted/20">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Conventional Commit Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {commitTypes.map((type) => (
              <div
                key={type.value}
                className="p-3 rounded-lg bg-muted/30 border border-border hover:border-accent/50 transition-all"
              >
                <Badge className={`${type.color} mb-2 text-xs`}>
                  {type.label}
                </Badge>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
