import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, StopCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  running: {
    label: "Running",
    icon: Loader2,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  stopped: {
    label: "Stopped",
    icon: StopCircle,
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn("flex items-center gap-1 text-xs font-medium", config.className, className)}
    >
      <Icon className={cn("h-3 w-3", status === "running" && "animate-spin")} />
      {config.label}
    </Badge>
  );
}

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  planning: { label: "Planning", className: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  playwright: { label: "Playwright", className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  analysis: { label: "Analysis", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  reporting: { label: "Reporting", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

export function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category] || { label: category, className: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
