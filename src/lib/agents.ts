import type {
  PRReview,
  SecurityFinding,
  CoverageReport,
  RepositoryHealth,
  FeatureRecommendation
} from './types'

export async function generatePRReview(diffText: string): Promise<PRReview> {
  const prompt = spark.llmPrompt`You are a code review AI agent. Analyze this PR diff and provide a detailed review.

PR Diff:
${diffText}

Return a JSON object with this structure:
{
  "filesChanged": <number>,
  "linesAdded": <number>,
  "linesRemoved": <number>,
  "overallScore": <number 0-100>,
  "comments": [
    {
      "line": <number>,
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "message": "<detailed comment>",
      "suggestion": "<optional suggestion>",
      "patch": "<optional code patch>"
    }
  ]
}`

  const result = await spark.llm(prompt, 'gpt-4o', true)
  const data = JSON.parse(result)
  
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    filesChanged: data.filesChanged,
    linesAdded: data.linesAdded,
    linesRemoved: data.linesRemoved,
    comments: data.comments.map((c: any) => ({
      id: crypto.randomUUID(),
      ...c
    })),
    overallScore: data.overallScore
  }
}

export async function analyzeSecurityVulnerabilities(code: string): Promise<SecurityFinding[]> {
  const prompt = spark.llmPrompt`You are a security analysis AI agent. Analyze this code for security vulnerabilities.

Code:
${code}

Identify potential security issues like SQL injection, XSS, CSRF, insecure dependencies, etc.

Return a JSON object with a single property "findings" that contains an array:
{
  "findings": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "category": "<vulnerability category>",
      "title": "<short title>",
      "description": "<detailed description>",
      "file": "<filename>",
      "line": <line number>,
      "cwe": "<CWE ID if applicable>",
      "remediation": "<how to fix>"
    }
  ]
}`

  const result = await spark.llm(prompt, 'gpt-4o', true)
  const data = JSON.parse(result)
  
  return data.findings.map((f: any) => ({
    id: crypto.randomUUID(),
    ...f
  }))
}

export async function generateTestsForUncovered(functionCode: string, functionName: string): Promise<string> {
  const prompt = spark.llmPrompt`You are a test generation AI agent. Generate comprehensive unit tests for this function.

Function name: ${functionName}

Function code:
${functionCode}

Generate tests that cover:
- Happy path scenarios
- Edge cases
- Error conditions
- Boundary values

Return only the test code, properly formatted and ready to use.`

  return await spark.llm(prompt, 'gpt-4o', false)
}

export async function generateCommitMessage(diff: string): Promise<string> {
  const prompt = spark.llmPrompt`You are a commit message generation AI. Analyze this git diff and generate a conventional commit message.

Diff:
${diff}

Follow the conventional commits format: <type>(<scope>): <subject>

Types: feat, fix, refactor, docs, test, chore, perf, style

Return ONLY the commit message, nothing else.`

  return await spark.llm(prompt, 'gpt-4o-mini', false)
}

export async function searchCodeSemantically(query: string, codebase: string): Promise<any[]> {
  const prompt = spark.llmPrompt`You are a semantic code search AI. The user is searching for: "${query}"

In this codebase:
${codebase.slice(0, 4000)}

Find the most relevant code snippets that match the user's intent.

Return a JSON object with a single property "results" containing:
{
  "results": [
    {
      "file": "<filename>",
      "line": <line number>,
      "snippet": "<code snippet>",
      "relevanceScore": <0-100>,
      "context": "<why this is relevant>"
    }
  ]
}

Limit to top 5 results.`

  const result = await spark.llm(prompt, 'gpt-4o', true)
  const data = JSON.parse(result)
  
  return data.results.map((r: any) => ({
    id: crypto.randomUUID(),
    ...r
  }))
}

export async function generateFeatureRecommendations(repoContext: string): Promise<FeatureRecommendation[]> {
  const prompt = spark.llmPrompt`You are an engineering advisor AI. Based on this repository analysis, provide strategic recommendations.

Repository Context:
${repoContext}

Consider:
- High churn modules that need refactoring
- Technical debt that should be addressed
- Missing features that would add value
- Security or performance improvements

Return a JSON object with a single property "recommendations":
{
  "recommendations": [
    {
      "title": "<recommendation title>",
      "priority": "critical" | "high" | "medium" | "low",
      "type": "feature" | "refactor" | "technical-debt",
      "rationale": "<why this matters>",
      "impact": "<expected impact>",
      "effort": "low" | "medium" | "high",
      "modules": ["<affected module>"]
    }
  ]
}

Provide 3-5 recommendations.`

  const result = await spark.llm(prompt, 'gpt-4o', true)
  const data = JSON.parse(result)
  
  return data.recommendations.map((r: any) => ({
    id: crypto.randomUUID(),
    ...r
  }))
}

export function calculateRepositoryHealth(): RepositoryHealth {
  return {
    overallScore: 78,
    doraMetrics: {
      leadTime: 2.5,
      deploymentFrequency: 12,
      changeFailureRate: 8,
      mttr: 45
    },
    technicalDebt: {
      score: 72,
      hotspots: ['auth-service', 'payment-processor', 'user-management']
    },
    codeChurn: {
      highChurnModules: ['api/routes/user.ts', 'components/Dashboard.tsx', 'lib/database.ts'],
      averageChurn: 15.3
    }
  }
}

export function parseCoverageReport(): CoverageReport {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    overallCoverage: 68.5,
    lineCoverage: 72.3,
    branchCoverage: 64.7,
    uncoveredFunctions: [
      {
        id: crypto.randomUUID(),
        name: 'validatePaymentMethod',
        file: 'src/lib/payment.ts',
        line: 145,
        complexity: 8
      },
      {
        id: crypto.randomUUID(),
        name: 'sanitizeUserInput',
        file: 'src/lib/security.ts',
        line: 89,
        complexity: 6
      },
      {
        id: crypto.randomUUID(),
        name: 'calculateDiscount',
        file: 'src/lib/pricing.ts',
        line: 234,
        complexity: 12
      }
    ]
  }
}