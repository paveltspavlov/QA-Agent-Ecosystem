import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, CheckCircle2, XCircle, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [ecosystemPath, setEcosystemPath] = useState("");
  const [pythonCommand, setPythonCommand] = useState("python");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings").then((r) => r.json()),
  });

  const { data: health, refetch: refetchHealth } = useQuery<{
    ok: boolean;
    ecosystemPath: string;
    ecosystemFound: boolean;
    outputsDirFound: boolean;
  }>({
    queryKey: ["/api/health"],
    queryFn: () => apiRequest("GET", "/api/health").then((r) => r.json()),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (settings) {
      setEcosystemPath(settings.ecosystemPath || "");
      setPythonCommand(settings.pythonCommand || "python");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiRequest("POST", "/api/settings", body).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      refetchHealth();
      toast({ title: "Settings saved", description: "Ecosystem path updated successfully" });
    },
    onError: () => {
      toast({ title: "Save failed", variant: "destructive" });
    },
  });

  function handleSave() {
    saveMutation.mutate({ ecosystemPath, pythonCommand });
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure the QA Agent Ecosystem connection</p>
      </div>

      {/* Status card */}
      <Card className={cn(
        "border",
        health?.ecosystemFound ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {health?.ecosystemFound ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", health?.ecosystemFound ? "text-emerald-400" : "text-red-400")}>
                {health?.ecosystemFound ? "Ecosystem connected" : "Ecosystem not found"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Path: {health?.ecosystemPath || "not set"}
              </p>
              {health && (
                <p className="text-xs text-muted-foreground">
                  Outputs directory: {health.outputsDirFound ? "found" : "not found (will be created on first run)"}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchHealth()}
              data-testid="button-refresh-health"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Ecosystem Configuration</CardTitle>
          <CardDescription className="text-xs">
            Point to the directory where QA-Agent-Ecosystem is cloned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ecosystem Path</Label>
            <div className="flex gap-2">
              <Input
                value={ecosystemPath}
                onChange={(e) => setEcosystemPath(e.target.value)}
                placeholder="/path/to/QA-Agent-Ecosystem"
                className="font-mono text-xs flex-1"
                data-testid="input-ecosystem-path"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Absolute path to the root of the QA-Agent-Ecosystem repository.
              The UI will read agents, workflows, and outputs from this directory.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Python Command</Label>
            <Input
              value={pythonCommand}
              onChange={(e) => setPythonCommand(e.target.value)}
              placeholder="python"
              className="font-mono text-xs max-w-48"
              data-testid="input-python-command"
            />
            <p className="text-xs text-muted-foreground">
              Command used to invoke Python (e.g. python, python3, /usr/local/bin/python3).
              The UI runs: <code className="font-mono bg-muted px-1 rounded">&lt;command&gt; -m qa_ecosystem ...</code>
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Usage guide */}
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Quick Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Clone the QA-Agent-Ecosystem repository to your machine</li>
            <li>
              Install the Python package:{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded">pip install -e .</code>
            </li>
            <li>
              Copy <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.example</code>{" "}
              to <code className="font-mono bg-muted px-1 py-0.5 rounded">.env</code> and set your API keys
            </li>
            <li>Set the Ecosystem Path above to the cloned directory</li>
            <li>Click Save and verify the connection status turns green</li>
          </ol>
          <p className="mt-3 font-medium text-foreground">Required API keys (in .env):</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="font-mono bg-muted px-1 rounded">ANTHROPIC_API_KEY</code> — for Claude agents</li>
            <li><code className="font-mono bg-muted px-1 rounded">GITHUB_TOKEN</code> — for Copilot agents (<code className="font-mono bg-muted px-1 rounded">gh auth login</code>)</li>
            <li><code className="font-mono bg-muted px-1 rounded">OPENAI_API_KEY</code> — for GPT agents (optional)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
