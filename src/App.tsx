import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { AgentStatusIndicator } from '@/components/AgentStatusIndicator'
import { PRReviewAgent } from '@/components/PRReviewAgent'
import { SecurityAnalysisAgent } from '@/components/SecurityAnalysisAgent'
import { CoverageOptimizerAgent } from '@/components/CoverageOptimizerAgent'
import { RepositoryHealthMonitor } from '@/components/RepositoryHealthMonitor'
import { CommitMessageGenerator } from '@/components/CommitMessageGenerator'
import { OrganizationHealthDashboard } from '@/components/OrganizationHealthDashboard'
import { PolicyEnforcementDashboard } from '@/components/PolicyEnforcementDashboard'
import { Sparkle, Brain } from '@phosphor-icons/react'
import type { Agent } from '@/lib/types'
import { Toaster } from '@/components/ui/sonner'

const agents: Agent[] = [
  {
    id: 'pr-review',
    name: 'PR Review',
    description: 'AI-powered code review',
    status: 'active',
    icon: 'GitPullRequest'
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Vulnerability detection',
    status: 'active',
    icon: 'ShieldCheck'
  },
  {
    id: 'coverage',
    name: 'Coverage',
    description: 'Test generation',
    status: 'active',
    icon: 'TestTube'
  },
  {
    id: 'commit',
    name: 'Commits',
    description: 'Message generation',
    status: 'active',
    icon: 'GitCommit'
  },
  {
    id: 'health',
    name: 'Health',
    description: 'Repository metrics',
    status: 'active',
    icon: 'Pulse'
  },
  {
    id: 'org-health',
    name: 'Org Health',
    description: 'Organization analysis',
    status: 'active',
    icon: 'Building'
  },
  {
    id: 'policy-enforcement',
    name: 'Policy',
    description: 'Automated enforcement',
    status: 'active',
    icon: 'ShieldCheck'
  }
]

function App() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent_0px,_transparent_50px,_oklch(0.25_0.05_265)_50px,_oklch(0.25_0.05_265)_51px)]" />
        
        <div className="relative">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="container mx-auto px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 glow-border">
                  <Brain size={32} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-shadow-glow">
                    CodeOracle AI
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Multi-Agent Software Engineering Platform
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-8 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-8 bg-card/50 p-1 h-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="pr-review" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  PR Review
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Security
                </TabsTrigger>
                <TabsTrigger value="coverage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Coverage
                </TabsTrigger>
                <TabsTrigger value="commit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Commits
                </TabsTrigger>
                <TabsTrigger value="health" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Health
                </TabsTrigger>
                <TabsTrigger value="org-health" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Org Health
                </TabsTrigger>
                <TabsTrigger value="policy-enforcement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Policy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="text-center space-y-4 py-12">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 animate-pulse-glow bg-accent rounded-full blur-xl opacity-50" />
                      <Sparkle size={64} weight="duotone" className="text-accent relative" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold">AI-Powered Code Intelligence</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Orchestrating specialized agents for comprehensive software engineering analysis
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                  {agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className="p-6 glow-border cursor-pointer hover:border-accent/50 transition-all hover:scale-105"
                      onClick={() => setActiveTab(agent.id)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Agent
                          </div>
                          <AgentStatusIndicator status={agent.status} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">{agent.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-8 glow-border bg-gradient-to-br from-card to-muted/20">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Multi-Agent Architecture</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-accent uppercase tracking-wide">Data Extraction Layer</h4>
                        <p className="text-muted-foreground">
                          Uses AST parsing with tree-sitter to analyze code structure and semantics
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-accent uppercase tracking-wide">Context Layer</h4>
                        <p className="text-muted-foreground">
                          Vector database for semantic code search and graph database for dependency mapping
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-accent uppercase tracking-wide">Reasoning Layer</h4>
                        <p className="text-muted-foreground">
                          Fine-tuned LLM orchestrator that coordinates specialized agents
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-accent uppercase tracking-wide">Execution Layer</h4>
                        <p className="text-muted-foreground">
                          Secure sandbox for running tests, linters, and security scanners
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="pr-review">
                <PRReviewAgent />
              </TabsContent>

              <TabsContent value="security">
                <SecurityAnalysisAgent />
              </TabsContent>

              <TabsContent value="coverage">
                <CoverageOptimizerAgent />
              </TabsContent>

              <TabsContent value="commit">
                <CommitMessageGenerator />
              </TabsContent>

              <TabsContent value="health">
                <RepositoryHealthMonitor />
              </TabsContent>

              <TabsContent value="org-health">
                <OrganizationHealthDashboard />
              </TabsContent>

              <TabsContent value="policy-enforcement">
                <PolicyEnforcementDashboard />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default App