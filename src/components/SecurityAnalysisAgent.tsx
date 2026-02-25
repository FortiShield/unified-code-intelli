import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldCheck, Warning } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SecurityFinding, SeverityLevel } from '@/lib/types'

const mockFindings: SecurityFinding[] = [
  {
    id: '1',
    severity: 'critical',
    category: 'SQL Injection',
    title: 'Unsafe SQL query concatenation',
    description: 'Direct string concatenation in SQL queries allows for SQL injection attacks',
    file: 'src/auth.ts',
    line: 45,
    cwe: 'CWE-89',
    remediation: 'Use parameterized queries or prepared statements'
  },
  {
    id: '2',
    severity: 'high',
    category: 'Authentication',
    title: 'Weak password hashing',
    description: 'Plain text password comparison detected',
    file: 'src/auth.ts',
    line: 52,
    cwe: 'CWE-759',
    remediation: 'Use bcrypt or argon2 for password hashing'
  },
  {
    id: '3',
    severity: 'medium',
    category: 'XSS',
    title: 'Unescaped user input',
    description: 'User input rendered without sanitization',
    file: 'src/components/UserProfile.tsx',
    line: 123,
    cwe: 'CWE-79',
    remediation: 'Sanitize user input before rendering'
  },
  {
    id: '4',
    severity: 'low',
    category: 'Information Disclosure',
    title: 'Verbose error messages',
    description: 'Stack traces exposed in production',
    file: 'src/api/error-handler.ts',
    line: 12,
    cwe: 'CWE-209',
    remediation: 'Log errors internally, show generic messages to users'
  }
]

export function SecurityAnalysisAgent() {
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

  const severityCounts = mockFindings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 glow-border">
          <ShieldCheck size={24} weight="duotone" className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Security Analysis</h2>
          <p className="text-sm text-muted-foreground">AI-powered vulnerability detection with zero noise</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['critical', 'high', 'medium', 'low'].map((severity) => (
          <Card key={severity} className="p-4 glow-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {severity}
                </div>
                <div className="text-3xl font-bold font-mono">
                  {severityCounts[severity] || 0}
                </div>
              </div>
              <Warning
                size={32}
                weight="duotone"
                className={
                  severity === 'critical' ? 'text-destructive' :
                  severity === 'high' ? 'text-warning' :
                  severity === 'medium' ? 'text-accent' :
                  'text-muted-foreground'
                }
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 glow-border">
        <h3 className="text-lg font-semibold mb-4">Security Findings ({mockFindings.length})</h3>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>File</TableHead>
                <TableHead>CWE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFindings.map((finding) => (
                <TableRow key={finding.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell>
                    <Badge className={getSeverityColor(finding.severity)}>
                      {finding.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{finding.category}</TableCell>
                  <TableCell>{finding.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {finding.file}:{finding.line}
                  </TableCell>
                  <TableCell>
                    {finding.cwe && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {finding.cwe}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Card className="p-6 glow-border bg-muted/20">
        <h3 className="text-lg font-semibold mb-3">Latest Finding Details</h3>
        <div className="space-y-4">
          {mockFindings[0] && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge className={getSeverityColor(mockFindings[0].severity)}>
                  {mockFindings[0].severity}
                </Badge>
                <span className="font-semibold">{mockFindings[0].title}</span>
              </div>
              <p className="text-sm text-foreground">{mockFindings[0].description}</p>
              <div className="p-4 rounded-lg bg-muted/50 border-l-2 border-accent">
                <div className="text-xs font-medium text-accent uppercase tracking-wide mb-2">Remediation</div>
                <p className="text-sm">{mockFindings[0].remediation}</p>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Location: {mockFindings[0].file}:{mockFindings[0].line}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}