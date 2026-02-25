import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useKV } from '@github/spark/hooks'
import { 
  Package, 
  Star, 
  Download, 
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  Clock,
  CurrencyDollar,
  Check,
  Lightning,
  Robot,
  CheckCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { MarketplaceApp } from '@/lib/githubApp'

const mockMarketplaceApps: MarketplaceApp[] = [
  {
    id: 'app-1',
    slug: 'coderabbit-ai',
    name: 'CodeRabbit AI',
    description: 'AI-powered PR reviews with contextual insights and automated fixes',
    category: ['Code Quality', 'AI', 'Code Review'],
    pricing: 'freemium',
    pricingPlans: [
      {
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['5 PR reviews/month', 'Basic analysis', 'Community support']
      },
      {
        name: 'Pro',
        price: 49,
        currency: 'USD',
        interval: 'month',
        features: ['Unlimited PR reviews', 'Advanced AI analysis', 'Auto-fix suggestions', 'Priority support', 'Custom rules']
      },
      {
        name: 'Enterprise',
        price: 299,
        currency: 'USD',
        interval: 'month',
        features: ['Everything in Pro', 'On-premise deployment', 'SSO & SAML', 'Dedicated support', 'Custom models', 'SLA guarantee']
      }
    ],
    publisher: {
      name: 'CodeRabbit Inc',
      verified: true,
      website: 'https://coderabbit.ai'
    },
    screenshots: [],
    logoUrl: '',
    installUrl: 'https://github.com/apps/coderabbit-ai',
    installations: 15420,
    rating: 4.8,
    reviews: 342,
    version: '2.5.0',
    lastUpdated: new Date('2024-01-15'),
    permissions: ['pull_requests', 'contents', 'checks'],
    events: ['pull_request', 'pull_request_review'],
    featured: true,
    verified: true
  },
  {
    id: 'app-2',
    slug: 'sourcery-refactor',
    name: 'Sourcery',
    description: 'Automated code refactoring and quality improvement suggestions',
    category: ['Code Quality', 'Refactoring', 'Productivity'],
    pricing: 'freemium',
    pricingPlans: [
      {
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['Public repos', 'Basic refactorings', 'PR comments']
      },
      {
        name: 'Pro',
        price: 29,
        currency: 'USD',
        interval: 'month',
        features: ['Private repos', 'Advanced refactorings', 'Custom rules', 'Team analytics']
      }
    ],
    publisher: {
      name: 'Sourcery AI',
      verified: true,
      website: 'https://sourcery.ai'
    },
    screenshots: [],
    logoUrl: '',
    installUrl: 'https://github.com/apps/sourcery-ai',
    installations: 8240,
    rating: 4.6,
    reviews: 189,
    version: '1.14.3',
    lastUpdated: new Date('2024-01-10'),
    permissions: ['pull_requests', 'contents'],
    events: ['pull_request', 'push'],
    featured: true,
    verified: true
  },
  {
    id: 'app-3',
    slug: 'codecov',
    name: 'Codecov',
    description: 'Code coverage reporting and analytics for better test visibility',
    category: ['Testing', 'Code Coverage', 'DevOps'],
    pricing: 'freemium',
    pricingPlans: [
      {
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['Unlimited public repos', 'Coverage reports', 'Basic analytics']
      },
      {
        name: 'Pro',
        price: 10,
        currency: 'USD',
        interval: 'month',
        features: ['Private repos', 'Advanced analytics', 'PR comments', 'Team reports', 'API access']
      },
      {
        name: 'Team',
        price: 50,
        currency: 'USD',
        interval: 'month',
        features: ['Everything in Pro', 'Unlimited users', 'Priority support', 'Custom integrations']
      }
    ],
    publisher: {
      name: 'Codecov',
      verified: true,
      website: 'https://codecov.io'
    },
    screenshots: [],
    logoUrl: '',
    installUrl: 'https://github.com/apps/codecov',
    installations: 23150,
    rating: 4.7,
    reviews: 521,
    version: '4.5.2',
    lastUpdated: new Date('2024-01-20'),
    permissions: ['checks', 'contents', 'pull_requests'],
    events: ['push', 'pull_request', 'workflow_run'],
    featured: true,
    verified: true
  },
  {
    id: 'app-4',
    slug: 'snyk-security',
    name: 'Snyk',
    description: 'Find and fix vulnerabilities in dependencies, containers, and code',
    category: ['Security', 'Dependencies', 'DevSecOps'],
    pricing: 'freemium',
    pricingPlans: [
      {
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['Unlimited tests', 'Dependency scanning', 'Public repos only']
      },
      {
        name: 'Team',
        price: 52,
        currency: 'USD',
        interval: 'month',
        features: ['Private repos', 'Container scanning', 'Code analysis', 'License compliance', 'Team reports']
      },
      {
        name: 'Enterprise',
        price: 229,
        currency: 'USD',
        interval: 'month',
        features: ['Everything in Team', 'SSO & SAML', 'Advanced policies', 'Audit logs', 'SLA support']
      }
    ],
    publisher: {
      name: 'Snyk Ltd',
      verified: true,
      website: 'https://snyk.io'
    },
    screenshots: [],
    logoUrl: '',
    installUrl: 'https://github.com/apps/snyk-io',
    installations: 31240,
    rating: 4.5,
    reviews: 687,
    version: '3.12.0',
    lastUpdated: new Date('2024-01-18'),
    permissions: ['checks', 'contents', 'security_events'],
    events: ['push', 'pull_request'],
    featured: true,
    verified: true
  },
  {
    id: 'app-5',
    slug: 'deepsource',
    name: 'DeepSource',
    description: 'Continuous code quality analysis with automated fixes',
    category: ['Code Quality', 'Static Analysis', 'Security'],
    pricing: 'freemium',
    pricingPlans: [
      {
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['Unlimited public repos', 'Basic analyzers', 'Auto-fixes']
      },
      {
        name: 'Pro',
        price: 30,
        currency: 'USD',
        interval: 'month',
        features: ['Private repos', 'All analyzers', 'Custom rules', 'Team dashboard']
      }
    ],
    publisher: {
      name: 'DeepSource Corp',
      verified: true,
      website: 'https://deepsource.io'
    },
    screenshots: [],
    logoUrl: '',
    installUrl: 'https://github.com/apps/deepsource',
    installations: 6890,
    rating: 4.6,
    reviews: 134,
    version: '2.8.1',
    lastUpdated: new Date('2024-01-12'),
    permissions: ['checks', 'contents', 'pull_requests'],
    events: ['push', 'pull_request'],
    featured: false,
    verified: true
  },
  {
    id: 'app-6',
    slug: 'qodo-gen',
    name: 'Qodo Gen',
    description: 'AI test generation and code analysis for better coverage',
    category: ['Testing', 'AI', 'Code Generation'],
    pricing: 'freemium',
    pricingPlans: [
      {
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['5 test generations/month', 'Basic coverage analysis']
      },
      {
        name: 'Pro',
        price: 39,
        currency: 'USD',
        interval: 'month',
        features: ['Unlimited test generation', 'Advanced coverage', 'Custom test templates', 'Priority AI']
      }
    ],
    publisher: {
      name: 'Qodo',
      verified: true,
      website: 'https://qodo.ai'
    },
    screenshots: [],
    logoUrl: '',
    installUrl: 'https://github.com/apps/qodo-merge',
    installations: 4210,
    rating: 4.7,
    reviews: 97,
    version: '1.9.2',
    lastUpdated: new Date('2024-01-08'),
    permissions: ['pull_requests', 'contents', 'checks'],
    events: ['pull_request', 'push'],
    featured: false,
    verified: true
  }
]

export function MarketplaceListing() {
  const [installedApps, setInstalledApps] = useKV<string[]>('installed-marketplace-apps', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPricing, setSelectedPricing] = useState<string>('all')
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const categories = ['all', 'AI', 'Code Quality', 'Security', 'Testing', 'DevOps', 'Productivity']

  const filteredApps = mockMarketplaceApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || app.category.includes(selectedCategory)
    const matchesPricing = selectedPricing === 'all' || app.pricing === selectedPricing
    return matchesSearch && matchesCategory && matchesPricing
  })

  const handleInstallApp = (app: MarketplaceApp) => {
    setInstalledApps(current => {
      const currentApps = current || []
      if (currentApps.includes(app.id)) {
        toast.info(`${app.name} is already installed`)
        return currentApps
      }
      toast.success(`${app.name} installed successfully`)
      return [...currentApps, app.id]
    })
  }

  const handleUninstallApp = (appId: string) => {
    setInstalledApps(current => {
      const app = mockMarketplaceApps.find(a => a.id === appId)
      if (app) {
        toast.success(`${app.name} uninstalled`)
      }
      return (current || []).filter(id => id !== appId)
    })
  }

  const isInstalled = (appId: string) => (installedApps || []).includes(appId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GitHub Marketplace</h2>
          <p className="text-sm text-muted-foreground">
            Discover and install apps to enhance your development workflow
          </p>
        </div>
        <Badge className="bg-accent/20 text-accent border-accent/30">
          {(installedApps || []).length} Installed
        </Badge>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPricing} onValueChange={setSelectedPricing}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Pricing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pricing</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="freemium">Freemium</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/50">
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="all">All Apps</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApps.filter(app => app.featured).map(app => (
              <Card 
                key={app.id} 
                className="p-6 glow-border hover:border-accent/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedApp(app)
                  setShowDetails(true)
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{app.name}</h3>
                        {app.verified && (
                          <CheckCircle size={18} weight="fill" className="text-accent" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{app.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {app.category.slice(0, 3).map(cat => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star size={16} weight="fill" className="text-warning" />
                        <span className="font-medium">{app.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Download size={16} />
                        <span>{(app.installations / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.pricing === 'free' ? (
                        <Badge className="bg-success/20 text-success border-success/30">Free</Badge>
                      ) : app.pricing === 'freemium' ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">Freemium</Badge>
                      ) : (
                        <Badge className="bg-warning/20 text-warning border-warning/30">Paid</Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    {isInstalled(app.id) ? (
                      <>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUninstallApp(app.id)
                          }}
                        >
                          <Check size={16} className="mr-2" />
                          Installed
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            toast.info('Configure app settings')
                          }}
                        >
                          Configure
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInstallApp(app)
                        }}
                      >
                        <Lightning size={16} className="mr-2" />
                        Install
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredApps.map(app => (
              <Card 
                key={app.id} 
                className="p-4 glow-border hover:border-accent/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedApp(app)
                  setShowDetails(true)
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{app.name}</h3>
                        {app.verified && (
                          <CheckCircle size={16} weight="fill" className="text-accent" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{app.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Star size={14} weight="fill" className="text-warning" />
                      <span>{app.rating}</span>
                    </div>
                    <span className="text-muted-foreground">{(app.installations / 1000).toFixed(1)}k installs</span>
                  </div>

                  <Button 
                    size="sm" 
                    className={isInstalled(app.id) ? "w-full bg-muted text-muted-foreground" : "w-full bg-accent text-accent-foreground"}
                    onClick={(e) => {
                      e.stopPropagation()
                      isInstalled(app.id) ? handleUninstallApp(app.id) : handleInstallApp(app)
                    }}
                  >
                    {isInstalled(app.id) ? 'Installed' : 'Install'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          {!installedApps || installedApps.length === 0 ? (
            <Card className="p-12 text-center">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Apps Installed</h3>
              <p className="text-sm text-muted-foreground">
                Browse the marketplace to discover and install apps
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockMarketplaceApps.filter(app => isInstalled(app.id)).map(app => (
                <Card key={app.id} className="p-6 glow-border">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{app.name}</h3>
                        <p className="text-sm text-muted-foreground">{app.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>Installed {app.lastUpdated.toLocaleDateString()}</span>
                      </div>
                      <div>v{app.version}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Configure
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-destructive hover:bg-destructive/10"
                        onClick={() => handleUninstallApp(app.id)}
                      >
                        Uninstall
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <DialogTitle className="text-2xl">{selectedApp.name}</DialogTitle>
                      {selectedApp.verified && (
                        <CheckCircle size={24} weight="fill" className="text-accent" />
                      )}
                    </div>
                    <DialogDescription>{selectedApp.description}</DialogDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star size={16} weight="fill" className="text-warning" />
                        <span className="font-medium">{selectedApp.rating}</span>
                        <span className="text-muted-foreground">({selectedApp.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Download size={16} />
                        <span>{(selectedApp.installations / 1000).toFixed(1)}k installations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Pricing Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedApp.pricingPlans?.map((plan, idx) => (
                      <Card key={idx} className={`p-4 ${idx === 1 ? 'border-accent glow-border-accent' : ''}`}>
                        <h4 className="font-bold text-lg mb-2">{plan.name}</h4>
                        <div className="mb-4">
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/{plan.interval}</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <Check size={16} className="text-accent mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Publisher:</span>
                      <span className="ml-2 font-medium">{selectedApp.publisher.name}</span>
                      {selectedApp.publisher.verified && (
                        <ShieldCheck size={16} weight="fill" className="inline ml-1 text-accent" />
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Version:</span>
                      <span className="ml-2 font-medium">{selectedApp.version}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="ml-2">{selectedApp.lastUpdated.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <span className="ml-2">{selectedApp.category.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Permissions Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.permissions.map((perm, idx) => (
                      <Badge key={idx} variant="outline" className="font-mono text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {isInstalled(selectedApp.id) ? (
                    <>
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          handleUninstallApp(selectedApp.id)
                          setShowDetails(false)
                        }}
                        variant="outline"
                      >
                        Uninstall
                      </Button>
                      <Button 
                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        Configure
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => {
                        handleInstallApp(selectedApp)
                        setShowDetails(false)
                      }}
                    >
                      <Lightning size={18} className="mr-2" />
                      Install App
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
