import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Play, Search, Bot } from "lucide-react";
import { useState } from "react";

interface AgentInfo {
  name: string;
  description: string;
  category: string;
  templates: { name: string; description: string }[];
}

const CATEGORY_ORDER = ["playwright", "planning", "analysis", "reporting"];
const CATEGORY_LABELS: Record<string, string> = {
  playwright: "Playwright Execution",
  planning: "Planning & Design",
  analysis: "Analysis & Quality",
  reporting: "Exploratory & Reporting",
};

function AgentCard({ agent }: { agent: AgentInfo }) {
  return (
    <Card className="border-card-border flex flex-col hover:border-primary/40 transition-colors" data-testid={`card-agent-${agent.name}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold leading-snug break-all">
              {agent.name}
            </CardTitle>
          </div>
          <CategoryBadge category={agent.category} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-between gap-3">
        <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
          {agent.description}
        </p>
        {agent.templates.length > 1 && (
          <p className="text-xs text-muted-foreground">
            {agent.templates.length} templates available
          </p>
        )}
        <Button asChild size="sm" className="w-full" data-testid={`button-run-${agent.name}`}>
          <Link href={`/run/agent/${agent.name}`}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Agent
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Agents() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: agents = [], isLoading } = useQuery<AgentInfo[]>({
    queryKey: ["/api/agents"],
    queryFn: () => apiRequest("GET", "/api/agents").then((r) => r.json()),
  });

  const filtered = agents.filter((a) => {
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || a.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const grouped = CATEGORY_ORDER.reduce<Record<string, AgentInfo[]>>((acc, cat) => {
    const items = filtered.filter((a) => a.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Agents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {agents.length} agents available — select one to run
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 w-56"
            data-testid="input-search-agents"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", ...CATEGORY_ORDER].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
              className="h-9 text-xs capitalize"
              data-testid={`button-filter-${cat}`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No agents match your search</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-3">
                {CATEGORY_LABELS[cat] || cat} ({items.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((agent) => (
                  <AgentCard key={agent.name} agent={agent} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
