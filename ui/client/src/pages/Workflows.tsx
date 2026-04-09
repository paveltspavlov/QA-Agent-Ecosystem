import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Play, GitBranch, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { useState } from "react";

interface WorkflowStep {
  index: number;
  agent: string;
  description: string;
  dependencies: number[];
}

interface WorkflowInfo {
  key: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

function StepFlow({ steps }: { steps: WorkflowStep[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {steps.map((step, i) => (
        <div key={step.index} className="flex items-start gap-2">
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30 text-xs font-mono text-primary font-bold">
              {step.index}
            </div>
            {i < steps.length - 1 && (
              <div className="h-full w-px bg-border mt-1" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-foreground font-mono">{step.agent}</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            {step.dependencies.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  after step{step.dependencies.length > 1 ? "s" : ""}{" "}
                  {step.dependencies.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: WorkflowInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-card-border hover:border-primary/40 transition-colors" data-testid={`card-workflow-${workflow.key}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 ring-1 ring-amber-500/20">
              <GitBranch className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight">{workflow.name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-[10px] font-mono text-muted-foreground border-border">
                {workflow.key}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0 bg-muted/50">
            {workflow.steps?.length || 0} steps
          </Badge>
        </div>
        <CardDescription className="text-xs mt-2">{workflow.description}</CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {workflow.steps?.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs w-full justify-start gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((e) => !e)}
            data-testid={`button-expand-${workflow.key}`}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {expanded ? "Hide" : "Show"} steps
          </Button>
        )}

        {expanded && <StepFlow steps={workflow.steps} />}

        <Button asChild size="sm" className="w-full" data-testid={`button-run-workflow-${workflow.key}`}>
          <Link href={`/run/workflow/${workflow.key}`}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Workflow
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Workflows() {
  const { data: workflows = [], isLoading } = useQuery<WorkflowInfo[]>({
    queryKey: ["/api/workflows"],
    queryFn: () => apiRequest("GET", "/api/workflows").then((r) => r.json()),
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Workflows</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {workflows.length} predefined pipelines — multi-agent orchestrations
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No workflows found</p>
          <p className="text-xs mt-1">Check your ecosystem path in Settings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <WorkflowCard key={wf.key} workflow={wf} />
          ))}
        </div>
      )}
    </div>
  );
}
