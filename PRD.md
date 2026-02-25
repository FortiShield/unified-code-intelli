# Planning Guide

A unified AI-powered software engineering platform that orchestrates multiple specialized agents to provide PR review, security analysis, code coverage optimization, semantic code search, repository health monitoring, and automated code suggestions through a multi-agent architecture with semantic knowledge graphs.

**Experience Qualities**: 
1. **Intelligent** - The platform feels like working with an expert engineering team, providing contextual insights that demonstrate deep understanding of your codebase structure and patterns.
2. **Orchestrated** - Multiple specialized agents work in harmony, each handling their domain expertise while the system presents a unified, coherent analysis interface.
3. **Actionable** - Every insight comes with concrete recommendations, one-click fixes, and automated improvements rather than just identifying problems.

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a sophisticated multi-agent system that requires multiple specialized views (PR Review, Security Analysis, Coverage Dashboard, Repo Health, Code Search, Feature Advisory), complex state management across agents, real-time analysis orchestration, and integration with multiple data sources (AST parsing, vector embeddings, coverage reports, security scanners).

## Essential Features

### Multi-Agent Orchestrator Dashboard
- **Functionality**: Central control panel that coordinates and displays outputs from all specialized AI agents (PR Review Agent, Security Agent, Coverage Agent, Search Agent, Health Advisor)
- **Purpose**: Provides unified visibility into all aspects of code quality, allowing developers to understand repository state at a glance
- **Trigger**: User navigates to main dashboard
- **Progression**: Load dashboard → Display agent status indicators → Show aggregated metrics from all agents → Present priority recommendations → Allow drill-down into specific agent views
- **Success criteria**: All agent statuses visible, metrics update in real-time, user can navigate to any specialized view

### PR Review & Auto-Fix Agent
- **Functionality**: Analyzes code diffs from GitHub PRs or manual input, retrieves semantic context from knowledge graph, generates inline comments with explanations, and provides one-click fix patches
- **Purpose**: Accelerates code review process while maintaining quality standards, reduces reviewer burden
- **Trigger**: User connects GitHub account → selects repository and PR number OR pastes PR diff manually
- **Progression**: Connect GitHub (optional) → Select repository → Choose PR from list → Auto-fetch diff → LLM analyzes with context → Generate comments with severity ratings → Suggest patches with explanations → User can apply fixes with one click
- **Success criteria**: Successfully fetches PRs from GitHub API, identifies logic flaws, suggests improvements, generates working patches, explains reasoning clearly

### Security Analysis Agent
- **Functionality**: Runs static analysis (Semgrep-style rules), identifies vulnerabilities, filters false positives using LLM reasoning, explains security implications in plain language
- **Purpose**: Proactively identifies security risks before they reach production, educates developers on security best practices
- **Trigger**: User initiates security scan or it runs automatically on PR analysis
- **Progression**: Scan code with pattern rules → Detect potential vulnerabilities → LLM filters noise and assesses real risk → Classify by severity (Critical/High/Medium/Low) → Generate explanations linking to CVE/CWE → Suggest remediation code
- **Success criteria**: Detects common vulnerabilities, minimal false positives, clear remediation guidance

### Coverage Optimizer & Test Generator
- **Functionality**: Parses coverage reports, identifies uncovered critical paths, generates unit tests for uncovered functions, validates tests actually increase coverage
- **Purpose**: Improves code reliability by ensuring comprehensive test coverage of critical business logic
- **Trigger**: User uploads coverage report or selects "Optimize Coverage"
- **Progression**: Parse coverage.xml → Identify uncovered functions/branches → Analyze function signatures and logic → Generate appropriate test cases → Display generated tests with expected assertions → User can preview and apply tests
- **Success criteria**: Identifies coverage gaps, generates syntactically correct tests, explains test purpose

### Semantic Code Search
- **Functionality**: Natural language search across entire codebase using vector embeddings, finds relevant code by intent rather than exact keywords
- **Purpose**: Helps developers quickly locate relevant code patterns, understand how features are implemented, find usage examples
- **Trigger**: User enters natural language query in search box
- **Progression**: User types query → Encode query to embedding vector → Search vector DB for similar code → Rank results by relevance → Display code snippets with context → Show file locations and related functions
- **Success criteria**: Returns relevant results for semantic queries, handles queries like "authentication logic" or "database connection pooling"

### Repository Health Monitor
- **Functionality**: Aggregates DORA metrics (lead time, deployment frequency, change failure rate, MTTR), calculates technical debt density, identifies high-churn modules
- **Purpose**: Provides leadership visibility into engineering velocity and quality trends, identifies refactoring priorities
- **Trigger**: Dashboard loads or user selects "Repo Health" view
- **Progression**: Load metrics → Calculate DORA indicators → Analyze commit history for churn patterns → LLM identifies technical debt hotspots → Generate health score → Display trend charts → Highlight areas needing attention
- **Success criteria**: Shows accurate metrics, identifies problem areas, trends are visible over time

### Commit Message Generator
- **Functionality**: Analyzes staged changes from GitHub commits or manual diff input and generates conventional commit messages following best practices
- **Purpose**: Maintains consistent commit history, saves developer time, improves project maintainability
- **Trigger**: User connects GitHub account → selects repository and commit OR pastes git diff manually
- **Progression**: Connect GitHub (optional) → Select repository → Choose commit from list → Auto-fetch diff → Identify changed functions/modules → Classify change type (feat/fix/refactor/docs) → Generate conventional commit message → User can copy to clipboard
- **Success criteria**: Successfully fetches commits from GitHub API, generates accurate and descriptive commit messages following conventional commit format

### Features Advisor (Executive Intelligence)
- **Functionality**: Analyzes codebase structure, team velocity, quality metrics, and pending features to provide strategic recommendations on what to build next or what to refactor first
- **Purpose**: Helps engineering leadership make data-driven decisions about feature prioritization and technical debt management
- **Trigger**: User selects "Features Advisor" from dashboard
- **Progression**: Aggregate all metrics → Analyze module stability and churn → Review feature request backlog → LLM synthesizes insights → Generate prioritized recommendations with rationale → Display risk assessment for each recommendation
- **Success criteria**: Provides actionable strategic insights, explains reasoning, prioritizes recommendations by impact

### GitHub Organization Health Dashboard
- **Functionality**: Comprehensive organization-level analysis including GitHub policy compliance, branch protection rules, resource limits (memory, cache, actions), repository security posture, DevSecOps maturity assessment, and high-potential repository identification with an overall org health percentage score
- **Purpose**: Provides C-level and engineering leadership with enterprise-wide visibility into security posture, policy compliance, resource utilization, and identifies repositories requiring attention or having high growth potential
- **Trigger**: User connects GitHub organization → selects "Org Health" view
- **Progression**: Authenticate with GitHub → Select organization → Fetch all repositories and org settings → Analyze branch protection policies → Check security settings (2FA enforcement, SSO, dependency scanning) → Assess resource limits (Actions minutes, package storage, cache usage) → Evaluate DevSecOps maturity (CI/CD coverage, automated testing, security scanning) → Score each repository → Identify high-potential repos based on activity, stars, contributors → Calculate weighted org health percentage → Display comprehensive dashboard with drill-down capabilities
- **Success criteria**: Successfully fetches org-wide data, accurately calculates health metrics, identifies policy violations, highlights high-potential repositories, provides actionable remediation steps with DevSecOps best practice recommendations

## Edge Case Handling

- **Empty Repository**: Display onboarding flow explaining how to connect repository and upload initial coverage reports
- **No Coverage Data**: Coverage optimizer shows message to upload coverage.xml, provides sample file format
- **Invalid PR Diff**: Show clear error message identifying parsing issue, provide format example
- **Vector DB Empty**: Code search prompts user to index repository first, shows indexing progress
- **LLM API Failures**: Graceful degradation - show cached results or static analysis only, display retry option
- **Extremely Large Diffs**: Automatically chunk large PRs into reviewable segments, analyze incrementally
- **Security Scan False Positives**: Allow users to mark false positives, system learns from feedback
- **Network Disconnection**: Queue analysis requests, process when reconnected, show offline indicator

## Design Direction

The design should evoke a sense of **technical sophistication**, **intelligence**, and **precision** - like working in a NASA mission control center or an advanced AI research lab. The interface should feel powerful yet approachable, with data-dense displays that remain visually organized. Think cyberpunk aesthetics meets modern developer tools - high-tech without being overwhelming, professional without being sterile.

## Color Selection

A high-contrast technical theme with electric accent colors that suggest AI intelligence and code analysis.

- **Primary Color**: `oklch(0.35 0.15 265)` - Deep electric blue-purple, communicates AI intelligence and technical depth, used for primary actions and agent status indicators
- **Secondary Colors**: 
  - Background layers: `oklch(0.12 0.02 265)` - Near-black with subtle blue tint for depth
  - Surface cards: `oklch(0.16 0.03 265)` - Slightly elevated dark surfaces
  - Borders: `oklch(0.25 0.05 265)` - Subtle glowing borders
- **Accent Color**: `oklch(0.75 0.20 140)` - Electric cyan, attention-grabbing for critical insights, success states, and interactive elements
- **Foreground/Background Pairings**: 
  - Primary text on background (`oklch(0.92 0.02 265)` on `oklch(0.12 0.02 265)`) - Ratio 13.2:1 ✓
  - Accent on surface (`oklch(0.75 0.20 140)` on `oklch(0.16 0.03 265)`) - Ratio 7.8:1 ✓
  - Warning orange (`oklch(0.70 0.18 50)` on `oklch(0.16 0.03 265)`) - Ratio 6.1:1 ✓
  - Critical red (`oklch(0.65 0.24 25)` on `oklch(0.16 0.03 265)`) - Ratio 5.2:1 ✓

## Font Selection

Typefaces should communicate technical precision while maintaining excellent readability for code analysis and dense information displays.

- **Primary Font**: JetBrains Mono - Monospace font excellent for code snippets, metrics, and data tables
- **Secondary Font**: Space Grotesk - Modern geometric sans for headings and UI labels, pairs well with monospace
- **Typographic Hierarchy**: 
  - H1 (Dashboard Title): Space Grotesk Bold/32px/tight tracking (-0.02em)
  - H2 (Agent Section): Space Grotesk Semibold/24px/normal tracking
  - H3 (Card Headers): Space Grotesk Medium/18px/normal tracking
  - Body (Descriptions): Space Grotesk Regular/14px/relaxed leading (1.6)
  - Code/Metrics: JetBrains Mono Regular/13px/monospace leading (1.4)
  - Labels: Space Grotesk Medium/12px/uppercase/wide tracking (0.05em)

## Animations

Animations should feel **precise and technical** - like systems powering on, data streaming in, or scanners analyzing code. Use subtle glowing effects, smooth state transitions, and purposeful motion that suggests AI processing.

Key animation moments:
- Agent activation: Subtle pulse/glow effect when agent begins analysis
- Data streaming: Progress bars with shimmer effect suggesting processing
- Results appearing: Staggered fade-in with slight slide-up (100ms delays between items)
- Severity indicators: Color transitions when changing between states
- Code diff highlights: Smooth background color transitions
- Search results: Quick fade + scale (from 0.98 to 1.0) for materialization effect
- Loading states: Orbital spinner or scanning line effect rather than generic spinner

## Component Selection

- **Components**: 
  - `Card` with custom glowing border for agent panels
  - `Tabs` for switching between agent views (PR Review, Security, Coverage, etc.)
  - `Badge` with custom colors for severity levels (Critical/High/Medium/Low)
  - `Progress` for coverage percentages and analysis status
  - `Dialog` for detailed code fix previews and test generation
  - `ScrollArea` for long code diffs and analysis results
  - `Table` for displaying metrics, vulnerabilities, and uncovered functions
  - `Separator` with glow effect for section divisions
  - `Button` with electric accent hover states
  - `Input` with focus glow for search
  - `Accordion` for expandable PR comments and security findings
  - `Tooltip` for metric explanations and terminology
- **Customizations**: 
  - Custom "Agent Status" component showing active/idle/processing states with animated indicators
  - Custom "Code Diff Viewer" with syntax highlighting and inline comments
  - Custom "Metric Card" with trend sparklines and comparison indicators
  - Custom "Recommendation Card" with priority badges and action buttons
- **States**: 
  - Buttons: Default has subtle border glow, hover intensifies glow and brightens background, active shows pressed state with reduced glow
  - Inputs: Focus state shows electric cyan border glow with smooth transition
  - Cards: Hover shows subtle elevation increase and border glow intensification
  - Agent indicators: Pulsing animation when processing, solid glow when active, dimmed when idle
- **Icon Selection**: 
  - @phosphor-icons with `weight="duotone"` for visual richness
  - `GitPullRequest` for PR review
  - `ShieldCheck` for security analysis
  - `TestTube` for test generation
  - `MagnifyingGlass` for semantic search
  - `HeartPulse` for repository health
  - `Sparkle` for AI/LLM features
  - `Warning` for vulnerabilities
  - `CheckCircle` for passed checks
  - `Clock` for metrics over time
- **Spacing**: 
  - Card padding: `p-6` for generous breathing room
  - Section gaps: `gap-6` between major sections
  - Item spacing: `gap-4` within sections
  - Compact areas (tables): `gap-2` for density
  - Page margins: `p-8` on main container
- **Mobile**: 
  - Stack agent cards vertically instead of grid
  - Tabs become horizontal scrollable list
  - Code diffs show in full-width single column
  - Metrics cards stack with full width
  - Search becomes primary action in sticky header
  - Side panels (if any) become bottom sheets
  - Font sizes reduce slightly (H1: 24px, body: 13px)
