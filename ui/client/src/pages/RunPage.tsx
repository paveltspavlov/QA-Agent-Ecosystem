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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Square, Trash2, Download, ChevronLeft, Bot, GitBranch,
  Terminal, Copy, CheckCheck, Info,
} from "lucide-react";
import type { Run } from "@shared/schema";

// Default model: GitHub Copilot provider — no API key needed, just gh auth login
const DEFAULT_MODEL = "copilot-claude-haiku";

// Group model profiles by provider for the selector
const COPILOT_MODELS = ["copilot-gpt4o", "copilot-o3-mini", "copilot-gemini", "copilot-claude-haiku"];
const ANTHROPIC_MODELS = ["claude-sonnet-api", "claude-opus-api", "claude-haiku-api"];
const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini"];
const LOCAL_MODELS = ["ollama-llama3", "ollama-qwen", "ollama-deepseek", "lmstudio", "vllm-local"];

function getModelGroup(model: string): string {
  if (COPILOT_MODELS.includes(model)) return "copilot";
  if (ANTHROPIC_MODELS.includes(model)) return "anthropic";
  if (OPENAI_MODELS.includes(model)) return "openai";
  if (LOCAL_MODELS.includes(model)) return "local";
  return "other";
}

// Strip ANSI escape codes
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "");
}

// Minimal ANSI color rendering
function renderAnsi(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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
- AC4: User can reset password via email`,
  "requirements-analyst": `## User Story: Shopping Cart Checkout

As a registered customer,
I want to complete the checkout process
So that I can purchase items in my cart.

### Acceptance Criteria
- I can review my cart items before paying
- I can enter shipping address
- I can choose from multiple payment methods
- I receive an order confirmation email`,
  "exploratory-tester": "https://demoqa.com",
  "playwright-test-generator": "https://demoqa.com",
  "security-scout": "https://demoqa.com",
  "accessibility-auditor": "https://demoqa.com",
};

// ── Terminal output component ─────────────────────────────────────────────────
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
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-[#8b949e] hover:text-[#c9d1d9]"
            onClick={handleCopy} title="Copy output" data-testid="button-copy-output">
            {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-[#8b949e] hover:text-[#c9d1d9]"
            onClick={handleDownload} title="Download output" data-testid="button-download-output">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef}
        className="terminal-output flex-1 p-4 rounded-b-md border border-[#30363d] overflow-y-auto text-[#c9d1d9] bg-[#0d1117]"
        style={{ minHeight: 320, maxHeight: 520 }}
        data-testid="terminal-output"
      >
        {lines.length === 0 ? (
          <span className="text-[#8b949e] italic">Waiting for output...</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderAnsi(line) }} />
          ))
        )}
        {status === "running" && (
          <span className="inline-block animate-pulse text-primary">▌</span>
        )}
      </div>
    </div>
  );
}

// ── CLI command panel ─────────────────────────────────────────────────────────
function CliCommandPanel({
  type, name, model, ecosystemPath,
}: { type: string; name: string; model: string; ecosystemPath: string }) {
  const [copied, setCopied] = useState(false);

  const command = type === "agent"
    ? `cd ${ecosystemPath || "/path/to/QA-Agent-Ecosystem"}\npython -m qa_ecosystem run --agent ${name} --input input.md --model ${model}`
    : `cd ${ecosystemPath || "/path/to/QA-Agent-Ecosystem"}\npython -m qa_ecosystem workflow ${name} --input input.md --model ${model}`;

  function handleCopy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-card-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Or run from terminal
            </CardTitle>
          </div>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground"
            onClick={handleCopy} data-testid="button-copy-cli">
            {copied ? <CheckCheck className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <pre className="text-xs font-mono text-[#c9d1d9] bg-[#0d1117] rounded p-3 whitespace-pre-wrap break-all leading-relaxed border border-[#30363d]">
          {command}
        </pre>
        <p className="text-[10px] text-muted-foreground mt-2">
          Save your input to <code className="font-mono bg-muted px-1 rounded">input.md</code> first.
          GitHub Copilot auth: <code className="font-mono bg-muted px-1 rounded">gh auth login</code>
        </p>
      </CardContent>
    </Card>
  );
}

// ── Model selector with grouped options ───────────────────────────────────────
function ModelSelect({
  value, onChange, models,
}: { value: string; onChange: (v: string) => void; models: string[] }) {
  const copilot = models.filter((m) => COPILOT_MODELS.includes(m));
  const anthropic = models.filter((m) => ANTHROPIC_MODELS.includes(m));
  const openai = models.filter((m) => OPENAI_MODELS.includes(m));
  const local = models.filter((m) => LOCAL_MODELS.includes(m));
  const other = models.filter((m) => !COPILOT_MODELS.includes(m) && !ANTHROPIC_MODELS.includes(m) && !OPENAI_MODELS.includes(m) && !LOCAL_MODELS.includes(m));

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm" data-testid="trigger-model">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {copilot.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-primary font-semibold">
              ★ GitHub Copilot (recommended)
            </SelectLabel>
            {copilot.map((m) => (
              <SelectItem key={m} value={m} data-testid={`option-model-${m}`}>{m}</SelectItem>
            ))}
          </SelectGroup>
        )}
        {anthropic.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold">Anthropic API</SelectLabel>
            {anthropic.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectGroup>
        )}
        {openai.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold">OpenAI API</SelectLabel>
            {openai.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectGroup>
        )}
        {local.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold">Local (Ollama / LM Studio)</SelectLabel>
            {local.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectGroup>
        )}
        {other.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold">Other</SelectLabel>
            {other.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RunPage() {
  const [, params] = useRoute("/run/:type/:name");

  const type = params?.type as "agent" | "workflow";
  const name = params?.name || "";

  const [input, setInput] = useState(SAMPLE_INPUTS[name] || "");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
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

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings").then((r) => r.json()),
  });

  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ["/api/agents"],
    queryFn: () => apiRequest("GET", "/api/agents").then((r) => r.json()),
    enabled: type === "agent",
  });

  const agentInfo = agents.find((a: any) => a.name === name);

  // When models load, ensure default is available or pick the first copilot model
  useEffect(() => {
    if (models.length > 0 && !models.includes(selectedModel)) {
      const firstCopilot = models.find((m) => COPILOT_MODELS.includes(m));
      if (firstCopilot) setSelectedModel(firstCopilot);
      else setSelectedModel(models[0]);
    }
  }, [models]);

  const startMutation = useMutation({
    mutationFn: (body: { type: string; name: string; input: string; model?: string }) =>
      apiRequest("POST", "/api/runs", body).then((r) => r.json()),
    onSuccess: (run: Run) => {
      setCurrentRunId(run.id);
      setOutputLines([]);
      setRunStatus("running");
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
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
      es.onerror = () => es.close();
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
      toast({ title: "Input required", description: "Enter input text or URL", variant: "destructive" });
      return;
    }
    startMutation.mutate({ type, name, input, model: selectedModel });
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
        {/* Copilot provider badge */}
        <div className="ml-auto flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-primary" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span className="text-xs font-medium text-primary">GitHub Copilot</span>
        </div>
      </div>

      {/* Copilot info banner */}
      <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          All agents run via <strong className="text-foreground">GitHub Copilot</strong> by default — no external API key needed.
          Just run <code className="font-mono bg-muted px-1 rounded">gh auth login</code> once in your terminal to authenticate.
          You can also run the same command directly from the terminal using the panel below.
        </p>
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
                <Label className="text-xs font-medium text-muted-foreground">
                  Model Profile
                  <span className="ml-1.5 text-primary font-normal">(Copilot recommended)</span>
                </Label>
                <ModelSelect
                  value={selectedModel}
                  onChange={setSelectedModel}
                  models={models.length > 0 ? models : [...COPILOT_MODELS, ...ANTHROPIC_MODELS]}
                />
              </div>

              {/* Template selector (agent only, >1 template) */}
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

              {/* Input */}
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
                  className="font-mono text-xs min-h-[200px] resize-none"
                  disabled={isRunning}
                  data-testid="textarea-input"
                />
                <p className="text-xs text-muted-foreground">{input.length} characters</p>
              </div>

              {/* Run / Stop / Clear */}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleRun}
                  disabled={isRunning || !input.trim()} data-testid="button-run">
                  <Play className="h-4 w-4 mr-1.5" />
                  {isRunning ? "Running..." : "Run via UI"}
                </Button>
                {isRunning && (
                  <Button variant="destructive" size="icon"
                    onClick={() => stopMutation.mutate()} title="Stop" data-testid="button-stop">
                    <Square className="h-4 w-4" />
                  </Button>
                )}
                {!isRunning && outputLines.length > 0 && (
                  <Button variant="outline" size="icon"
                    onClick={handleClear} title="Clear" data-testid="button-clear">
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  About this agent
                </p>
                <p className="text-sm text-foreground">{agentInfo.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Terminal equivalent */}
          <CliCommandPanel
            type={type}
            name={name}
            model={selectedModel}
            ecosystemPath={settings.ecosystemPath || ""}
          />
        </div>

        {/* Right: Terminal output */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Live Output
          </p>
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
