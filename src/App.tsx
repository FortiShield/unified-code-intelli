import { GitHubOrganizationPortal } from '@/components/GitHubOrganizationPortal'
import { Brain, Building2, CircleDashed, GithubLogo, Rocket } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent_0px,_transparent_50px,_oklch(0.25_0.05_265)_50px,_oklch(0.25_0.05_265)_51px)]" />

        <div className="relative">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="container mx-auto px-8 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20 glow-border">
                    <Brain size={32} weight="duotone" className="text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-shadow-glow">CodeOracle AI</h1>
                    <p className="text-sm text-muted-foreground">Centralized GitHub Organization Platform</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
                    <GithubLogo size={14} />
                    GitHub GraphQL + REST sync
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
                    <Building2 size={14} />
                    Organization-wide portal
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
                    <Rocket size={14} />
                    AI-generated docs
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-8 py-8">
            <GitHubOrganizationPortal />
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default App