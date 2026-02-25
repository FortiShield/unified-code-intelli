import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TestTube, Sparkle } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { parseCoverageReport } from '@/lib/agents'
import type { CoverageReport } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { generateTestsForUncovered } from '@/lib/agents'
import { toast } from 'sonner'

export function CoverageOptimizerAgent() {
  const [coverage, setCoverage] = useState<CoverageReport | null>(null)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)
  const [generatedTest, setGeneratedTest] = useState<string>('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const report = parseCoverageReport()
    setCoverage(report)
  }, [])

  const handleGenerateTest = async (func: any) => {
    setSelectedFunction(func.id)
    setGenerating(true)
    
    try {
      const mockCode = `function ${func.name}(input: any) {\n  // Function implementation\n  return result;\n}`
      const test = await generateTestsForUncovered(mockCode, func.name)
      setGeneratedTest(test)
      toast.success('Test generated successfully!')
    } catch (error) {
      toast.error('Failed to generate test')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  if (!coverage) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 glow-border">
          <TestTube size={24} weight="duotone" className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Coverage Optimizer</h2>
          <p className="text-sm text-muted-foreground">AI-powered test generation for uncovered code</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 glow-border">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Coverage</div>
            <div className="text-4xl font-bold font-mono">{coverage.overallCoverage}%</div>
            <Progress value={coverage.overallCoverage} className="h-2" />
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Line Coverage</div>
            <div className="text-4xl font-bold font-mono">{coverage.lineCoverage}%</div>
            <Progress value={coverage.lineCoverage} className="h-2" />
          </div>
        </Card>

        <Card className="p-6 glow-border">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Branch Coverage</div>
            <div className="text-4xl font-bold font-mono">{coverage.branchCoverage}%</div>
            <Progress value={coverage.branchCoverage} className="h-2" />
          </div>
        </Card>
      </div>

      <Card className="p-6 glow-border">
        <h3 className="text-lg font-semibold mb-4">Uncovered Functions ({coverage.uncoveredFunctions.length})</h3>
        <div className="space-y-3">
          {coverage.uncoveredFunctions.map((func) => (
            <div
              key={func.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border hover:border-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold">{func.name}</span>
                  <Badge variant="outline" className="text-xs">
                    Complexity: {func.complexity}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {func.file}:{func.line}
                </div>
              </div>
              <Button
                onClick={() => handleGenerateTest(func)}
                size="sm"
                className="glow-border-accent"
              >
                <Sparkle size={16} weight="duotone" className="mr-2" />
                Generate Tests
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={selectedFunction !== null} onOpenChange={() => setSelectedFunction(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generated Test</DialogTitle>
            <DialogDescription>
              AI-generated unit test for uncovered function
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            {generating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="animate-pulse-glow w-12 h-12 rounded-full bg-accent mx-auto" />
                  <p className="text-muted-foreground">Generating test...</p>
                </div>
              </div>
            ) : (
              <pre className="p-4 rounded-lg bg-muted/50 font-mono text-xs overflow-x-auto">
                {generatedTest}
              </pre>
            )}
          </ScrollArea>
          {!generating && (
            <div className="flex gap-2">
              <Button className="flex-1">Copy to Clipboard</Button>
              <Button variant="outline" className="flex-1">Save to File</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}