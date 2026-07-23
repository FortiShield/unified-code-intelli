import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  Building2,
  CircleDashed,
  Cloud,
  Database,
  GitBranch,
  GitPullRequest,
  Globe,
  LayoutGrid,
  Package,
  Search,
  Shield,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { githubClient } from '@/lib/github'
import { GitHubAuth } from '@/components/GitHubAuth'
import { getOrganizationPortalSnapshot } from '@/lib/orgPortal'

const kpis = [
  { label: 'Repositories', value: '428', accent: 'text-cyan-300' },
  { label: 'Stars', value: '12.8k', accent: 'text-amber-300' },
  { label: 'Forks', value: '2.1k', accent: 'text-emerald-300' },
  { label: 'PRs / week', value: '184', accent: 'text-violet-300' },
  { label: 'Security score', value: '94/100', accent: 'text-rose-300' },
  { label: 'CI success', value: '99.2%', accent: 'text-teal-300' },
]

const discoverySteps = [
  'Fetch every org repository via GitHub GraphQL and REST',
  'Analyze metadata, README, docs, ADRs, workflows, packages, and releases',
  'Build a unified catalog and source-of-truth metadata graph',
  'Generate docs, API references, and AI summaries automatically',
  'Publish synchronized pages and event-driven updates to the portal',
]

const repositories = [
  { name: 'portal', type: 'Frontend', detail: 'Developer portal and organization landing experience' },
  { name: 'docs', type: 'Documentation', detail: 'Centralized docs, API, release notes, and tutorials' },
  { name: 'search', type: 'Search', detail: 'Hybrid semantic + keyword indexing across repos and packages' },
  { name: 'graph', type: 'Knowledge Graph', detail: 'Repo-to-repo dependency and ownership relationship mapping' },
  { name: 'ai', type: 'LLM Services', detail: 'Summaries, Q&A, embeddings, and generated release notes' },
]

const portalSections = [
  'Overview',
  'Projects',
  'Packages',
  'SDKs',
  'Architecture',
  'Docs',
  'API',
  'Tutorials',
  'Roadmaps',
  'Releases',
  'Community',
  'Security',
]

const pipelineStages = [
  'Crawler',
  'Analyzer',
  'Indexing',
  'Knowledge graph',
  'AI summaries',
  'Portal publish',
]

const roadmap = [
  { phase: 'MVP', title: 'Organization discovery + portal shell', detail: 'Repository inventory, docs landing page, search, CI, and release sync.' },
  { phase: 'Growth', title: 'AI docs and knowledge graph', detail: 'Cross-repo dependency graph, semantic search, generated architecture summaries.' },
  { phase: 'Enterprise', title: 'Global orchestration and governance', detail: 'Policy enforcement, code scanning, multi-org federation, and autoscaling indexing.' },
]

export function GitHubOrganizationPortal() {
  const [orgName, setOrgName] = useState('github')
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [syncSummary, setSyncSummary] = useState({
    repositoryCount: 428,
    starCount: 12800,
    forkCount: 2100,
    contributorCount: 542,
  })
  const [orgRepositories, setOrgRepositories] = useState<Array<{
    name: string
    visibility: string
    archived: boolean
    fork: boolean
    stargazers_count: number
    forks_count: number
    updated_at: string
  }>>([])

  useEffect(() => {
    const syncLiveSnapshot = async () => {
      if (!githubClient.isAuthenticated()) {
        return
      }

      try {
        const snapshot = await getOrganizationPortalSnapshot(orgName)
        setOrgRepositories(snapshot.repositories)
        setSyncSummary(snapshot.summary)
      } catch (error: any) {
        console.warn('Portal sync unavailable:', error.message)
      }
    }

    void syncLiveSnapshot()
  }, [orgName])

  const handleSync = async () => {
    if (!githubClient.isAuthenticated()) {
      toast.error('Connect GitHub first to enable live organization synchronization')
      return
    }

    setIsSyncing(true)

    try {
      const snapshot = await getOrganizationPortalSnapshot(orgName)

      setOrgRepositories(snapshot.repositories)
      setSyncSummary(snapshot.summary)

      toast.success(`Synced ${orgName} organization inventory`, {
        description: `Discovered ${snapshot.summary.repositoryCount} repositories and refreshed the portal snapshot`,
      })
    } catch (error: any) {
      toast.error('Organization sync failed', {
        description: error.message || 'Unable to load the selected organization snapshot',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredRepositories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return orgRepositories
    }

    return orgRepositories.filter((repo) =>
      repo.name.toLowerCase().includes(query) || repo.visibility.toLowerCase().includes(query)
    )
  }, [orgRepositories, searchTerm])

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              <Sparkles size={14} />
              GitHub Organization Platform
            </div>
            <div>
              <h2 className="text-4xl font-semibold tracking-tight">AI-native developer portal for the entire GitHub organization</h2>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                A single source of truth that automatically discovers repositories, documents architecture, packages, releases,
                workflows, contributors, and dependencies, then publishes a Vercel-grade internal portal.
              </p>
            </div>
          </div>

          <div className="w-full max-w-md rounded-2xl border border-border bg-background/80 p-4">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Search size={16} />
              Search repositories, docs, APIs, packages, contributors
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-xl border border-border bg-card px-3 py-2">Keyword + semantic</div>
              <div className="rounded-xl border border-border bg-card px-3 py-2">Vector hybrid search</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Repositories', value: syncSummary.repositoryCount.toLocaleString(), accent: 'text-cyan-300' },
          { label: 'Stars', value: syncSummary.starCount.toLocaleString(), accent: 'text-amber-300' },
          { label: 'Forks', value: syncSummary.forkCount.toLocaleString(), accent: 'text-emerald-300' },
          { label: 'Contributors', value: syncSummary.contributorCount.toLocaleString(), accent: 'text-violet-300' },
          { label: 'Security score', value: '94/100', accent: 'text-rose-300' },
          { label: 'CI success', value: '99.2%', accent: 'text-teal-300' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${item.accent}`}>{item.value}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Globe size={16} />
            Repository discovery pipeline
          </div>
          <div className="grid gap-3">
            {discoverySteps.map((step, index) => (
              <div key={step} className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="text-sm text-muted-foreground">{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Search size={16} />
            Live organization sync
          </div>
          <div className="space-y-3">
            <GitHubAuth />
            <div className="rounded-2xl border border-border bg-background/60 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Source org</div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  className="flex-1"
                  placeholder="github"
                />
                <Button onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Connect a GitHub token to fetch the real organization inventory and refresh the portal snapshot.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <LayoutGrid size={16} />
            Portal surface
          </div>
          <div className="grid grid-cols-2 gap-2">
            {portalSections.map((section) => (
              <div key={section} className="rounded-2xl border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                {section}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Boxes size={16} />
            Repository catalog
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Search repo catalog</div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Filter repositories"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1.1fr_0.6fr_0.5fr_0.5fr] gap-2 bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <div>Repository</div>
                <div>Visibility</div>
                <div>Stars</div>
                <div>Forks</div>
              </div>
              {filteredRepositories.length > 0 ? (
                filteredRepositories.map((repo) => (
                  <div key={repo.name} className="grid grid-cols-[1.1fr_0.6fr_0.5fr_0.5fr] gap-2 border-t border-border bg-background/60 px-3 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowRight size={14} className="text-muted-foreground" />
                      <div>
                        <div className="font-semibold text-foreground">{repo.name}</div>
                        <div className="text-xs text-muted-foreground">{repo.archived ? 'Archived' : 'Active'}{repo.fork ? ' • fork' : ''}</div>
                      </div>
                    </div>
                    <div className="text-muted-foreground">{repo.visibility}</div>
                    <div className="text-muted-foreground">{repo.stargazers_count}</div>
                    <div className="text-muted-foreground">{repo.forks_count}</div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-6 text-sm text-muted-foreground">No repositories match the current filter.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <BookOpen size={16} />
            Documentation generator
          </div>
          <div className="grid gap-3">
            {[
              'README, docs/, wiki, Markdown, ADR, RFC, and design doc ingestion',
              'Auto-creation of navigation, sidebar, search, cross references, and diagrams',
              'Repository pages with Overview, Installation, Examples, Config, Roadmap, Releases, Contributors, and Security',
              'OpenAPI, Swagger, TypeDoc, Rust docs, Python docs, Go docs, .NET docs, and GraphQL references',
            ].map((entry) => (
              <div key={entry} className="rounded-2xl border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                {entry}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <Workflow size={16} />
          Platform automation pipeline
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {pipelineStages.map((stage, index) => (
            <div key={stage} className="rounded-2xl border border-border bg-background/60 p-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stage {index + 1}</div>
              <div className="mt-2 text-sm font-semibold">{stage}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <GitBranch size={16} />
            Knowledge graph
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-border bg-background/60 p-3">Repo A uses Repo B</div>
            <div className="rounded-2xl border border-border bg-background/60 p-3">Repo B depends on Repo C</div>
            <div className="rounded-2xl border border-border bg-background/60 p-3">Repo C extends Repo D</div>
            <div className="rounded-2xl border border-border bg-background/60 p-3">Generated dependency graph feeds architecture and roadmap pages.</div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Bot size={16} />
            AI summarization pipeline
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Overview and purpose extraction',
              'Architecture and dependency summarization',
              'Release notes and migration guidance',
              'FAQ, troubleshooting, and contributor onboarding',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Database size={16} />
            Data and services
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>PostgreSQL for inventory and metadata</div>
            <div>Redis for caching and queue control</div>
            <div>OpenSearch for docs and hybrid search</div>
            <div>Qdrant for vectors and embeddings</div>
            <div>ClickHouse for usage and metrics analytics</div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Cloud size={16} />
            Infra and deployment
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>Docker and Kubernetes runtime</div>
            <div>GitHub Actions workflows for sync and publish</div>
            <div>Terraform for environment provisioning</div>
            <div>Webhook-driven updates to keep the portal current</div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Shield size={16} />
            Security model
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>GitHub Apps and least-privilege token scopes</div>
            <div>Dependabot, CodeQL, and security advisory ingestion</div>
            <div>Permission-aware public/private repository publishing</div>
            <div>Audit history for portal updates and sync events</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <Building2 size={16} />
          Phased implementation roadmap
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {roadmap.map((item) => (
            <div key={item.phase} className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">{item.phase}</div>
              <div className="mt-2 text-lg font-semibold">{item.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <Package size={16} />
          Package and API coverage
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {['npm', 'Cargo', 'PyPI', 'Go', 'Docker', 'GitHub Packages', 'Maven', 'NuGet'].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-background/60 p-3 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <CircleDashed size={16} />
          Deliverables summary
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border bg-background/60 p-3">System architecture, monorepo structure, database schema</div>
          <div className="rounded-2xl border border-border bg-background/60 p-3">GitHub API layer, crawler, docs engine, search indexing, knowledge graph</div>
          <div className="rounded-2xl border border-border bg-background/60 p-3">GitHub Actions, webhook events, auth and permissions, DAP/DevEx portal UX</div>
          <div className="rounded-2xl border border-border bg-background/60 p-3">API specification, deployment architecture, scaling strategy, testing and migration plan</div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Ready for execution</div>
            <h3 className="mt-1 text-2xl font-semibold">Portal architecture aligned to GitHub-native platform operations</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            <GitPullRequest size={16} />
            Auto-synchronized from GitHub events
          </div>
        </div>
      </section>
    </div>
  )
}
