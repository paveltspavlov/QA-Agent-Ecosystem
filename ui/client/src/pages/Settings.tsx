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

      {/* GitHub Copilot auth — primary provider */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-primary shrink-0" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            <CardTitle className="text-sm font-semibold text-primary">GitHub Copilot — Primary AI Provider</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            All agents use GitHub Copilot by default (<code className="font-mono bg-muted px-1 rounded">copilot-claude-haiku</code>).
            No API key needed — authenticate once with the GitHub CLI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-[#0d1117] border border-[#30363d] p-3 font-mono text-xs text-[#c9d1d9] space-y-1">
            <p><span className="text-[#8b949e]"># Step 1 — authenticate with GitHub (one-time)</span></p>
            <p>gh auth login</p>
            <p className="mt-2"><span className="text-[#8b949e]"># Step 2 — verify Copilot access</span></p>
            <p>gh copilot --version</p>
            <p className="mt-2"><span className="text-[#8b949e]"># Step 3 — run any agent from terminal</span></p>
            <p>python -m qa_ecosystem run --agent test-case-generator \</p>
            <p className="pl-4">--input input.md --model copilot-claude-haiku</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Available Copilot models: <code className="font-mono bg-muted px-1 rounded">copilot-claude-haiku</code> (default),{" "}
            <code className="font-mono bg-muted px-1 rounded">copilot-gpt4o</code>,{" "}
            <code className="font-mono bg-muted px-1 rounded">copilot-o3-mini</code>,{" "}
            <code className="font-mono bg-muted px-1 rounded">copilot-gemini</code>
          </p>
        </CardContent>
      </Card>

      {/* General setup guide */}
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
              Authenticate with GitHub:{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded">gh auth login</code>
            </li>
            <li>Set the Ecosystem Path above to the cloned directory</li>
            <li>Click Save and verify the connection status turns green</li>
            <li>Go to Agents or Workflows and click Run — or copy the terminal command</li>
          </ol>
          <p className="mt-3 font-medium text-foreground">Optional API keys (in .env) for non-Copilot models:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="font-mono bg-muted px-1 rounded">ANTHROPIC_API_KEY</code> — claude-sonnet-api, claude-opus-api</li>
            <li><code className="font-mono bg-muted px-1 rounded">OPENAI_API_KEY</code> — gpt-4o, gpt-4o-mini</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
