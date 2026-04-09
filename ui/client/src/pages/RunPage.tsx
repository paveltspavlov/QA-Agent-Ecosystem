import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Square, Trash2, Download, ChevronLeft, Bot, GitBranch,
  Terminal, Copy, CheckCheck,
} from "lucide-react";
import type { Run } from "@shared/schema";

// Strip ANSI escape codes from terminal output
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "");
}

// Simple ANSI color rendering (basic support)
function renderAnsi(text: string): string {
  return text
    .replace(/\x1B\[0m/g, "</span>")
    .replace(/\x1B\[1m/g, '<span class="ansi-bold">')
    .replace(/\x1B\[2m/g, '<span class="ansi-dim">')
    .replace(/\x1B\[36m/g, '<span class="ansi-cyan">')
    .replace(/\x1B\[32m/g, '<span class="ansi-green">')
    .replace(/\x1B\[31m/g, '<span class="ansi-red">')
    .replace(/\x1B\[33m/g, '<span class="ansi-yellow">');
}

const SAMPLE_INPUTS: Record<string, string> = {
  "test-case-generator": `## Feature: User Login

### Acceptance Criteria
- AC1: User can login with valid email and password
- AC2: System shows error for invalid credentials
- AC3: Account is locked after 5 failed attempts
- AC4: User can reset password via email

### Out of Scope
- Social login (OAuth)
- Two-factor authentication`,
  "requirements-analyst": `## User Story: Shopping Cart Checkout

As a registered customer,
I want to complete the checkout process
So that I can purchase items in my cart.

### Acceptance Criteria
- I can review my cart items before paying
- I can enter shipping address
- I can choose from multiple payment methods
- I receive an order confirmation email`,
  "exploratory-tester": `https://demoqa.com`,
  "playwright-test-generator": `https://demoqa.com`,
};

function TerminalOutput({ lines, runId, status }: {
  lines: string[];
  runId?: number;
  status?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const fullText = lines.join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(stripAnsi(fullText));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([stripAnsi(fullText)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run-${runId || "output"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Terminal toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border border-[#30363d] border-b-0 rounded-t-md">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          <Terminal className="h-3.5 w-3.5 text-[#8b949e] ml-2" />
          <span className="text-xs text-[#8b949e]">output</span>
        </div>
        <div className="flex items-center gap-1">
          {status && <StatusBadge status={status} />}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-[#8b949e] hover:text-[#c9d1d9]"
            onClick={handleCopy}
            title="Copy output"
            data-testid="button-copy-output"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-[#8b949e] hover:text-[#c9d1d9]"
            onClick={handleDownload}
            title="Download output"
            data-testid="button-download-output"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="terminal-output flex-1 p-4 rounded-b-md border border-[#30363d] overflow-y-auto text-[#c9d1d9] bg-[#0d1117]"
        style={{ minHeight: 320, maxHeight: 520 }}
        data-testid="terminal-output"
      >
        {lines.length === 0 ? (
          <span className="text-[#8b949e] italic">Waiting for output...</span>
        ) : (
          lines.map((line, i) => (
            <div
              key={i}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderAnsi(line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) }}
            />
          ))
        )}
        {status === "running" && (
          <span className="inline-block animate-pulse text-primary">▌</span>
        )}
      </div>
    </div>
  );
}

export default function RunPage() {
  const [matchAgent] = useRoute("/run/agent/:name");
  const [matchWorkflow] = useRoute("/run/workflow/:name");
  const [, params] = useRoute("/run/:type/:name");

  const type = params?.type as "agent" | "workflow";
  const name = params?.name || "";

  const [input, setInput] = useState(SAMPLE_INPUTS[name] || "");
  const [selectedModel, setSelectedModel] = useState<string>("default");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  const [currentRunId, setCurrentRunId] = useState<number | null>(null);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [runStatus, setRunStatus] = useState<string | undefined>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<string[]>({
    queryKey: ["/api/models"],
    queryFn: () => apiRequest("GET", "/api/models").then((r) => r.json()),
  });

  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ["/api/agents"],
    queryFn: () => apiRequest("GET", "/api/agents").then((r) => r.json()),
    enabled: type === "agent",
  });

  const agentInfo = agents.find((a) => a.name === name);

  const startMutation = useMutation({
    mutationFn: (body: { type: string; name: string; input: string; model?: string }) =>
      apiRequest("POST", "/api/runs", body).then((r) => r.json()),
    onSuccess: (run: Run) => {
      setCurrentRunId(run.id);
      setOutputLines([]);
      setRunStatus("running");
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      // Connect SSE
      const API_BASE = (window as any).__PORT_5000__ || "";
      const es = new EventSource(`${API_BASE}/api/runs/${run.id}/stream`);
      eventSourceRef.current = es;
      es.onmessage = (e) => {
        const line = JSON.parse(e.data);
        setOutputLines((prev) => [...prev, line]);
      };
      es.addEventListener("done", (e) => {
        const { status } = JSON.parse((e as MessageEvent).data);
        setRunStatus(status);
        es.close();
        queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        toast({
          title: `Run ${status}`,
          description: `${name} finished with status: ${status}`,
          variant: status === "completed" ? "default" : "destructive",
        });
      });
      es.onerror = () => {
        es.close();
      };
    },
    onError: (err: any) => {
      toast({ title: "Failed to start run", description: err.message, variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/runs/${currentRunId}/stop`).then((r) => r.json()),
    onSuccess: () => {
      setRunStatus("stopped");
      eventSourceRef.current?.close();
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      toast({ title: "Run stopped" });
    },
  });

  function handleRun() {
    if (!input.trim()) {
      toast({ title: "Input required", description: "Please enter input text or URL", variant: "destructive" });
      return;
    }
    const body: any = { type, name, input };
    if (selectedModel !== "default") body.model = selectedModel;
    startMutation.mutate(body);
  }

  function handleClear() {
    setOutputLines([]);
    setCurrentRunId(null);
    setRunStatus(undefined);
  }

  const isRunning = runStatus === "running" || startMutation.isPending;
  const displayName = name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const TypeIcon = type === "agent" ? Bot : GitBranch;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-8 -ml-2">
          <Link href={type === "agent" ? "/agents" : "/workflows"}>
            <ChevronLeft className="h-4 w-4 mr-0.5" />
            Back
          </Link>
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
            <TypeIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{displayName}</h1>
            <p className="text-xs text-muted-foreground capitalize">{type}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* Left: Config panel */}
        <div className="space-y-4">
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Model Profile</Label>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  data-testid="select-model"
                >
                  <SelectTrigger className="h-9 text-sm" data-testid="trigger-model">
                    <SelectValue placeholder="Default model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (from models.yaml)</SelectItem>
                    {models.map((m) => (
                      <SelectItem key={m} value={m} data-testid={`option-model-${m}`}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template selector (agent only) */}
              {type === "agent" && agentInfo?.templates?.length > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentInfo.templates.map((t: any) => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.name} — {t.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Input textarea */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Input {type === "agent" ? "/ Requirements / PBI" : "/ Context / URL"}
                </Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    type === "agent"
                      ? "Paste requirements, PBI text, test data, URL, or file path..."
                      : "Enter context, URL, or path to the target..."
                  }
                  className="font-mono text-xs min-h-[220px] resize-none"
                  disabled={isRunning}
                  data-testid="textarea-input"
                />
                <p className="text-xs text-muted-foreground">
                  {input.length} characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleRun}
                  disabled={isRunning || !input.trim()}
                  data-testid="button-run"
                >
                  <Play className="h-4 w-4 mr-1.5" />
                  {isRunning ? "Running..." : "Run"}
                </Button>
                {isRunning && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => stopMutation.mutate()}
                    title="Stop"
                    data-testid="button-stop"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
                {!isRunning && outputLines.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClear}
                    title="Clear output"
                    data-testid="button-clear"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent description */}
          {agentInfo && (
            <Card className="border-card-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">About this agent</p>
                <p className="text-sm text-foreground">{agentInfo.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Terminal output */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Output</p>
          <TerminalOutput lines={outputLines} runId={currentRunId || undefined} status={runStatus} />
          {runStatus === "completed" && (
            <p className="text-xs text-muted-foreground text-center">
              Output saved → check{" "}
              <Link href="/reports" className="text-primary hover:underline">
                Reports
              </Link>{" "}
              for the generated files
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
