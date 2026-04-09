import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "wouter";
import {
  Bot, GitBranch, FileText, Activity, Play, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import type { Run } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

function formatName(name: string) {
  return name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function Dashboard() {
  const { data: runs = [] } = useQuery<Run[]>({
    queryKey: ["/api/runs"],
    queryFn: () => apiRequest("GET", "/api/runs").then((r) => r.json()),
    refetchInterval: 5000,
  });
  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ["/api/agents"],
    queryFn: () => apiRequest("GET", "/api/agents").then((r) => r.json()),
  });
  const { data: workflows = [] } = useQuery<any[]>({
    queryKey: ["/api/workflows"],
    queryFn: () => apiRequest("GET", "/api/workflows").then((r) => r.json()),
  });
  const { data: reports = [] } = useQuery<any[]>({
    queryKey: ["/api/reports"],
    queryFn: () => apiRequest("GET", "/api/reports").then((r) => r.json()),
  });

  const totalReports = reports.reduce((sum: number, group: any) => sum + group.files.length, 0);
  const completed = runs.filter((r) => r.status === "completed").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const running = runs.filter((r) => r.status === "running").length;
  const successRate = runs.length > 0 ? Math.round((completed / runs.length) * 100) : 0;

  const recentRuns = runs.slice(0, 8);

  const stats = [
    {
      label: "Total Runs",
      value: runs.length,
      icon: Activity,
      sub: `${running} active now`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Agents",
      value: agents.length,
      icon: Bot,
      sub: "Available agents",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Workflows",
      value: workflows.length,
      icon: GitBranch,
      sub: "Predefined pipelines",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Reports",
      value: totalReports,
      icon: FileText,
      sub: "Generated outputs",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            QA Agent Ecosystem — control panel
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" data-testid="button-go-agents">
            <Link href="/agents">
              <Bot className="h-4 w-4 mr-1.5" />
              Run Agent
            </Link>
          </Button>
          <Button asChild size="sm" data-testid="button-go-workflows">
            <Link href="/workflows">
              <GitBranch className="h-4 w-4 mr-1.5" />
              Run Workflow
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-card-border" data-testid={`card-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Run success metrics */}
      {runs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-card-border">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-card-border">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-400 shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-card-border">
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent runs */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Runs</CardTitle>
            {runs.length > 8 && (
              <span className="text-xs text-muted-foreground">{runs.length} total</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentRuns.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No runs yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start by running an agent or workflow
              </p>
            </div>
          ) : (
            <table className="w-full text-sm" data-testid="table-recent-runs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Started</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr key={run.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-run-${run.id}`}>
                    <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">
                      {formatName(run.name)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-muted-foreground capitalize">{run.type}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                        <Link href={`/run/${run.type}/${run.name}`}>
                          <Play className="h-3 w-3 mr-1" />
                          Re-run
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
