import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { GitPullRequest, Sparkle, GithubLogo } from '@phosphor-icons/react'
import type { PRReview, SeverityLevel } from '@/lib/types'
import { generatePRReview } from '@/lib/agents'
import { githubClient, type PullRequest } from '@/lib/github'
import { GitHubAuth } from './GitHubAuth'
import { GitHubPRSelector } from './GitHubPRSelector'
import { toast } from 'sonner'

const sampleDiff = `diff --git a/src/auth.ts b/src/auth.ts
index 1234567..89abcdef 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,7 +10,7 @@ export function authenticateUser(username: string, password: string) {
-  const query = "SELECT * FROM users WHERE username = '" + username + "'";
+  const query = db.prepare("SELECT * FROM users WHERE username = ?").bind(username);
   const user = db.execute(query);
   
-  if (user && user.password === password) {
+  if (user && await bcrypt.compare(password, user.passwordHash)) {
     return generateToken(user);
   }`

export function PRReviewAgent() {
  const [diffText, setDiffText] = useState(sampleDiff)
  const [review, setReview] = useState<PRReview | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [inputMode, setInputMode] = useState<'manual' | 'github'>('manual')

  const handleAnalyze = async () => {
    if (!diffText.trim()) {
      toast.error('Please paste a PR diff to analyze')
      return
    }

    setAnalyzing(true)
    try {
      const result = await generatePRReview(diffText)
      setReview(result)
      toast.success('PR analysis complete!')
    } catch (error) {
      toast.error('Failed to analyze PR')
      console.error(error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSelectPR = async (owner: string, repo: string, prNumber: number, pr: PullRequest) => {
    setSelectedPR(pr)
    setAnalyzing(true)
    try {
      const diff = await githubClient.getPullRequestDiff(owner, repo, prNumber)
      setDiffText(diff)
      toast.success(`Loaded PR #${prNumber}`)
      
      const result = await generatePRReview(diff)
      setReview(result)
      toast.success('PR analysis complete!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch PR diff')
      console.error(error)
    } finally {
      setAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: SeverityLevel) => {
    const colors = {
      critical: 'bg-destructive text-destructive-foreground',
      high: 'bg-warning text-background',
      medium: 'bg-accent text-accent-foreground',
      low: 'bg-primary text-primary-foreground',
      info: 'bg-muted text-muted-foreground'
    }
    return colors[severity]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 glow-border">
          <GitPullRequest size={24} weight="duotone" className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">PR Review Agent</h2>
          <p className="text-sm text-muted-foreground">AI-powered code review with automated fixes</p>
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
          <GitHubPRSelector onSelectPR={handleSelectPR} />
          {selectedPR && (
            <Card className="p-4 bg-accent/10 border-accent/30">
              <div className="flex items-center gap-3">
                <GithubLogo size={20} weight="fill" className="text-accent" />
                <div>
                  <p className="text-sm font-medium">
                    PR #{selectedPR.number}: {selectedPR.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPR.head.ref} → {selectedPR.base.ref}
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
                  Paste PR Diff
                </label>
                <Textarea
                  id="pr-diff"
                  value={diffText}
                  onChange={(e) => setDiffText(e.target.value)}
                  placeholder="Paste your git diff here..."
                  className="font-mono text-xs min-h-[200px] focus:glow-border-accent"
                  rows={10}
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full glow-border-accent hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Sparkle size={18} weight="duotone" className="mr-2" />
                {analyzing ? 'Analyzing PR...' : 'Analyze PR'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {review && (
        <Card className="p-6 glow-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review Results</h3>
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-muted-foreground">Score:</span>
                <span className={`text-2xl font-bold ${review.overallScore >= 80 ? 'text-success' : review.overallScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                  {review.overallScore}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 font-mono text-sm">
              <div className="p-3 rounded bg-muted/50">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Files Changed</div>
                <div className="text-xl font-semibold mt-1">{review.filesChanged}</div>
              </div>
              <div className="p-3 rounded bg-muted/50">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Lines Added</div>
                <div className="text-xl font-semibold mt-1 text-success">+{review.linesAdded}</div>
              </div>
              <div className="p-3 rounded bg-muted/50">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Lines Removed</div>
                <div className="text-xl font-semibold mt-1 text-destructive">-{review.linesRemoved}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground uppercase tracking-wide mb-3">
                Comments ({review.comments.length})
              </h4>
              <ScrollArea className="h-[400px]">
                <Accordion type="multiple" className="space-y-2">
                  {review.comments.map((comment) => (
                    <AccordionItem key={comment.id} value={comment.id} className="border border-border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          <Badge className={getSeverityColor(comment.severity)}>
                            {comment.severity}
                          </Badge>
                          <span className="text-sm text-left flex-1">{comment.message.slice(0, 80)}...</span>
                          <span className="font-mono text-xs text-muted-foreground">Line {comment.line}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-3">
                        <p className="text-sm text-foreground">{comment.message}</p>
                        {comment.suggestion && (
                          <div className="p-3 rounded bg-muted/50 border-l-2 border-accent">
                            <div className="text-xs font-medium text-accent uppercase tracking-wide mb-1">Suggestion</div>
                            <p className="text-sm">{comment.suggestion}</p>
                          </div>
                        )}
                        {comment.patch && (
                          <div className="p-3 rounded bg-muted/50 border-l-2 border-success">
                            <div className="text-xs font-medium text-success uppercase tracking-wide mb-1">Auto-Fix Available</div>
                            <pre className="text-xs font-mono overflow-x-auto">{comment.patch}</pre>
                            <Button size="sm" variant="outline" className="mt-2">
                              Apply Fix
                            </Button>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}