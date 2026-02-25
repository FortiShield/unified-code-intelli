import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building, 
  ShieldCheck, 
  TrendUp, 
  GitBranch, 
  Warning, 
  Sparkle,
  ChartBar,
  Lightning,
  Database,
  CirclesFour
} from '@phosphor-icons/react'
import { githubClient } from '@/lib/github'
import { analyzeOrganizationHealth } from '@/lib/orgHealth'
import type { OrganizationHealth, SeverityLevel } from '@/lib/types'
import { toast } from 'sonner'
import { AgentStatusIndicator } from './AgentStatusIndicator'
import { cn } from '@/lib/utils'

export function OrganizationHealthDashboard() {
  const [orgName, setOrgName] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [healthData, setHealthData] = useState<OrganizationHealth | null>(null)

  const handleAnalyze = async () => {
    if (!orgName.trim()) {
      toast.error('Please enter an organization name')
      return
    }

    if (!githubClient.isAuthenticated()) {
      toast.error('Please connect to GitHub first')
      return
    }

    setIsAnalyzing(true)
    setSelectedOrg(orgName)
    
    try {
      toast.info('Starting organization analysis...', {
        description: 'This may take a few moments'
      })

      const data = await analyzeOrganizationHealth(orgName)
      setHealthData(data)
      
      toast.success('Analysis complete!', {
        description: `Analyzed ${data.analyzedRepositories} repositories`
      })
    } catch (error: any) {
      console.error('Analysis error:', error)
      toast.error('Analysis failed', {
        description: error.message || 'Could not complete organization analysis'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-accent'
    if (score >= 40) return 'text-warning'
    return 'text-destructive'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'high': return 'bg-warning text-foreground'
      case 'medium': return 'bg-accent text-accent-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getDevSecOpsLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'initial': 'Initial',
      'managed': 'Managed',
      'defined': 'Defined',
      'quantitatively-managed': 'Quantitatively Managed',
      'optimizing': 'Optimizing'
    }
    return labels[level] || level
  }

  return (
    <div className="space-y-6">
      <Card className="p-8 glow-border bg-gradient-to-br from-card to-muted/20">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 glow-border">
              <Building size={32} weight="duotone" className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold">Organization Health Analysis</h2>
              <p className="text-muted-foreground">
                Comprehensive security, policy, and DevSecOps assessment for your GitHub organization
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              id="org-name"
              placeholder="Enter organization name (e.g., microsoft, facebook)"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1"
              disabled={isAnalyzing}
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !orgName.trim()}
              className="px-8"
            >
              {isAnalyzing ? (
                <>
                  <AgentStatusIndicator status="processing" size="sm" />
                  <span className="ml-2">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkle weight="duotone" className="mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {isAnalyzing && (
        <Card className="p-8 glow-border-accent">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AgentStatusIndicator status="processing" size="lg" />
              <div>
                <h3 className="text-lg font-semibold">Analyzing {selectedOrg}</h3>
                <p className="text-sm text-muted-foreground">
                  Fetching repositories, evaluating policies, and calculating health metrics...
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="text-muted-foreground">Scanning repositories...</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          </div>
        </Card>
      )}

      {healthData && !isAnalyzing && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 glow-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <ChartBar size={24} weight="duotone" className="text-primary" />
                  <AgentStatusIndicator status="active" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                    Overall Health
                  </p>
                  <p className={cn("text-4xl font-bold mt-2", getHealthColor(healthData.overallHealthScore))}>
                    {healthData.overallHealthScore.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getHealthLabel(healthData.overallHealthScore)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glow-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Database size={24} weight="duotone" className="text-accent" />
                  <Badge variant="outline">{healthData.analyzedRepositories} analyzed</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                    Repositories
                  </p>
                  <p className="text-4xl font-bold mt-2">
                    {healthData.totalRepositories}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total in organization
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glow-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Warning size={24} weight="duotone" className="text-warning" />
                  <Badge className={healthData.policyViolations.length > 0 ? 'bg-warning' : 'bg-success'}>
                    {healthData.policyViolations.length} issues
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                    Policy Violations
                  </p>
                  <p className="text-4xl font-bold mt-2">
                    {healthData.policyViolations.filter(v => v.severity === 'critical' || v.severity === 'high').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Critical & high severity
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glow-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TrendUp size={24} weight="duotone" className="text-success" />
                  <Badge variant="outline">{healthData.highPotentialRepos.length} found</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                    High Potential
                  </p>
                  <p className="text-4xl font-bold mt-2 text-success">
                    {healthData.highPotentialRepos.length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Repositories to watch
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-card/50 p-1 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="branch-protection">Branch Protection</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="devsecops">DevSecOps</TabsTrigger>
              <TabsTrigger value="violations">Violations</TabsTrigger>
              <TabsTrigger value="high-potential">High Potential</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 glow-border">
                  <h3 className="text-xl font-bold mb-4">DevSecOps Maturity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Maturity Level</span>
                      <Badge className="bg-primary">{getDevSecOpsLevelLabel(healthData.devSecOpsMaturity.level)}</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Score</span>
                        <span className="font-mono">{healthData.devSecOpsMaturity.overallScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={healthData.devSecOpsMaturity.overallScore} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>CI/CD Coverage</span>
                        <span className="font-mono">{healthData.devSecOpsMaturity.cicdCoverage.toFixed(1)}%</span>
                      </div>
                      <Progress value={healthData.devSecOpsMaturity.cicdCoverage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Security Scanning</span>
                        <span className="font-mono">{healthData.devSecOpsMaturity.securityScanningCoverage.toFixed(1)}%</span>
                      </div>
                      <Progress value={healthData.devSecOpsMaturity.securityScanningCoverage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Code Review Coverage</span>
                        <span className="font-mono">{healthData.devSecOpsMaturity.codeReviewCoverage.toFixed(1)}%</span>
                      </div>
                      <Progress value={healthData.devSecOpsMaturity.codeReviewCoverage} className="h-2" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 glow-border">
                  <h3 className="text-xl font-bold mb-4">Key Recommendations</h3>
                  <div className="space-y-3">
                    {healthData.recommendations.slice(0, 5).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Lightning size={20} weight="duotone" className="text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                    {healthData.recommendations.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recommendations - your organization is in great shape!
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="branch-protection" className="space-y-6">
              <Card className="p-6 glow-border">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <GitBranch size={24} weight="duotone" className="text-primary" />
                    <h3 className="text-2xl font-bold">Branch Protection Rules</h3>
                  </div>
                  <Badge className={cn(
                    healthData.branchProtection.score >= 70 ? 'bg-success' : 'bg-warning'
                  )}>
                    {healthData.branchProtection.compliantRepos} / {healthData.branchProtection.totalRepos} compliant
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold">Compliance Score</span>
                      <span className="font-mono font-bold">{healthData.branchProtection.score.toFixed(1)}%</span>
                    </div>
                    <Progress value={healthData.branchProtection.score} className="h-3" />
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Violations by Repository</h4>
                    <div className="space-y-2">
                      {healthData.branchProtection.violations.slice(0, 10).map((violation, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
                          <div className="flex-1">
                            <p className="font-mono text-sm font-semibold">{violation.repoName}</p>
                            <p className="text-xs text-muted-foreground mt-1">{violation.description}</p>
                          </div>
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                        </div>
                      ))}
                      {healthData.branchProtection.violations.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          All repositories have adequate branch protection!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="p-6 glow-border">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck size={24} weight="duotone" className="text-accent" />
                  <h3 className="text-2xl font-bold">Security Posture</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                      <span className="font-medium">2FA Required</span>
                      <Badge className={healthData.security.twoFactorRequired ? 'bg-success' : 'bg-destructive'}>
                        {healthData.security.twoFactorRequired ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                      <span className="font-medium">Dependabot</span>
                      <Badge className={healthData.security.dependabotEnabled ? 'bg-success' : 'bg-warning'}>
                        {healthData.security.dependabotEnabled ? 'Enabled' : 'Limited'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                      <span className="font-medium">Secret Scanning</span>
                      <Badge className={healthData.security.secretScanningEnabled ? 'bg-success' : 'bg-warning'}>
                        {healthData.security.secretScanningEnabled ? 'Enabled' : 'Limited'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">Security Score</span>
                        <span className="font-mono font-bold">{healthData.security.score.toFixed(1)}%</span>
                      </div>
                      <Progress value={healthData.security.score} className="h-3" />
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <h4 className="font-semibold text-sm mb-2">Best Practices</h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>✓ Enable 2FA for all members</li>
                        <li>✓ Use Dependabot for automated updates</li>
                        <li>✓ Enable secret scanning on all repos</li>
                        <li>✓ Configure code scanning with CodeQL</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="devsecops" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 glow-border">
                  <h4 className="font-semibold mb-4 text-lg">CI/CD Adoption</h4>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className={cn("text-5xl font-bold", getHealthColor(healthData.devSecOpsMaturity.cicdCoverage))}>
                        {healthData.devSecOpsMaturity.cicdCoverage.toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">of repositories</p>
                    </div>
                    <Progress value={healthData.devSecOpsMaturity.cicdCoverage} className="h-2" />
                  </div>
                </Card>

                <Card className="p-6 glow-border">
                  <h4 className="font-semibold mb-4 text-lg">Security Scanning</h4>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className={cn("text-5xl font-bold", getHealthColor(healthData.devSecOpsMaturity.securityScanningCoverage))}>
                        {healthData.devSecOpsMaturity.securityScanningCoverage.toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">coverage rate</p>
                    </div>
                    <Progress value={healthData.devSecOpsMaturity.securityScanningCoverage} className="h-2" />
                  </div>
                </Card>

                <Card className="p-6 glow-border">
                  <h4 className="font-semibold mb-4 text-lg">Code Reviews</h4>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className={cn("text-5xl font-bold", getHealthColor(healthData.devSecOpsMaturity.codeReviewCoverage))}>
                        {healthData.devSecOpsMaturity.codeReviewCoverage.toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">enforced reviews</p>
                    </div>
                    <Progress value={healthData.devSecOpsMaturity.codeReviewCoverage} className="h-2" />
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="violations" className="space-y-6">
              <Card className="p-6 glow-border">
                <h3 className="text-2xl font-bold mb-4">Policy Violations</h3>
                <div className="space-y-3">
                  {healthData.policyViolations.slice(0, 20).map((violation, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/20 border border-border space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(violation.severity)}>
                              {violation.severity}
                            </Badge>
                            <Badge variant="outline">{violation.policyType}</Badge>
                          </div>
                          <p className="font-mono text-sm font-semibold">{violation.repoName}</p>
                          <p className="text-sm mt-2">{violation.description}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Remediation:</span> {violation.remediation}
                        </p>
                      </div>
                    </div>
                  ))}
                  {healthData.policyViolations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No policy violations detected! 🎉
                    </p>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="high-potential" className="space-y-6">
              <Card className="p-6 glow-border">
                <h3 className="text-2xl font-bold mb-4">High Potential Repositories</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Repositories showing strong growth, community engagement, and quality metrics
                </p>
                <div className="space-y-4">
                  {healthData.highPotentialRepos.map((repo, idx) => (
                    <div key={idx} className="p-5 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendUp size={20} weight="duotone" className="text-accent" />
                            <p className="font-mono text-lg font-bold">{repo.repoName}</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Potential Score</p>
                              <p className="font-bold text-accent">{repo.potentialScore.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Growth Rate</p>
                              <p className="font-bold">{repo.growthRate.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Community</p>
                              <p className="font-bold">{repo.communityEngagement.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Code Quality</p>
                              <p className="font-bold">{repo.codeQuality.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Why it's high potential:</p>
                        <div className="flex flex-wrap gap-2">
                          {repo.reasons.map((reason, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {repo.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Recommendations:</p>
                          <div className="flex flex-wrap gap-2">
                            {repo.recommendations.map((rec, i) => (
                              <Badge key={i} className="text-xs bg-primary/20 text-foreground">
                                {rec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {healthData.highPotentialRepos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No high-potential repositories identified in this analysis
                    </p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
