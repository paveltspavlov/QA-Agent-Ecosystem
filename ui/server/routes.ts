import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import {
  initJwtSecret, requireAuth, requireAdmin, signToken,
  setAuthCookie, clearAuthCookie, hashPassword, verifyPassword, safeUser,
  type AuthRequest,
} from "./auth";
import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import yaml from "js-yaml";

// ---------------------------------------------------------------------------
// In-memory process registry
// ---------------------------------------------------------------------------
const runningProcesses = new Map<number, ChildProcess>();
const sseClients = new Map<number, Response[]>();
const outputBuffers = new Map<number, string>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getEcosystemPath(): string {
  return (
    storage.getSetting("ecosystemPath") ||
    process.env.ECOSYSTEM_PATH ||
    path.join(__dirname, "../../qa-agent-repo") ||
    "."
  );
}

function getOutputsDir(): string {
  return path.join(getEcosystemPath(), "outputs");
}

function broadcastToClients(runId: number, chunk: string): void {
  const clients = sseClients.get(runId) || [];
  const prev = outputBuffers.get(runId) || "";
  outputBuffers.set(runId, prev + chunk);
  for (const res of clients) {
    try {
      const lines = chunk.split("\n");
      for (const line of lines) {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    } catch (_) {}
  }
}

function sendDoneEvent(runId: number, status: string): void {
  const clients = sseClients.get(runId) || [];
  for (const res of clients) {
    try {
      res.write(`event: done\ndata: ${JSON.stringify({ status })}\n\n`);
      res.end();
    } catch (_) {}
  }
  sseClients.delete(runId);
}

function loadWorkflows(): Record<string, any> {
  try {
    const ecoPath = getEcosystemPath();
    const wfPath = path.join(ecoPath, "qa_ecosystem", "workflows.yaml");
    if (fs.existsSync(wfPath)) {
      const raw = fs.readFileSync(wfPath, "utf-8");
      const parsed = yaml.load(raw) as any;
      return parsed?.workflows || {};
    }
  } catch (_) {}
  return FALLBACK_WORKFLOWS;
}

function loadAgents(): AgentInfo[] {
  try {
    const ecoPath = getEcosystemPath();
    const templatesDir = path.join(ecoPath, "qa_ecosystem", "templates");
    const agents: AgentInfo[] = [];
    if (fs.existsSync(templatesDir)) {
      const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".yaml"));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(templatesDir, file), "utf-8");
          const parsed = yaml.load(raw) as any;
          if (parsed?.agent && parsed?.templates?.[0]) {
            const name = parsed.agent;
            agents.push({
              name,
              description: parsed.templates[0].description || `Run ${name}`,
              category: getAgentCategory(name),
              templates: (parsed.templates || []).map((t: any) => ({
                name: t.name,
                description: t.description,
              })),
            });
          }
        } catch (_) {}
      }
    }
    if (agents.length > 0) return agents;
  } catch (_) {}
  return FALLBACK_AGENTS;
}

function getAgentCategory(name: string): string {
  if (
    ["playwright-test-generator", "ui-test-designer", "playwright-executor",
      "playwright-recorder", "playwright-copilot", "playwright-copilot-bridge",
      "seed-data-manager", "test-validator"].includes(name)
  ) return "playwright";
  if (
    ["api-coverage-planner", "api-contract-validator", "pr-hygiene-checker",
      "security-scout", "coverage-hunter", "flake-triage", "inventory-builder",
      "accessibility-auditor", "performance-profiler"].includes(name)
  ) return "analysis";
  if (["exploratory-tester", "bug-reporter", "report-creator"].includes(name))
    return "reporting";
  return "planning";
}

interface AgentInfo {
  name: string;
  description: string;
  category: string;
  templates: { name: string; description: string }[];
}

// ---------------------------------------------------------------------------
// Fallback data (used when ecosystem is not yet configured)
// ---------------------------------------------------------------------------
const FALLBACK_AGENTS: AgentInfo[] = [
  { name: "test-case-generator", description: "Generate ISTQB test cases from requirements", category: "planning", templates: [{ name: "default", description: "Comprehensive test case generation" }] },
  { name: "requirements-analyst", description: "Analyze requirements for gaps and ambiguities", category: "planning", templates: [{ name: "default", description: "Requirements analysis" }] },
  { name: "bug-pattern-analyst", description: "Analyze bug reports for patterns and trends", category: "planning", templates: [{ name: "default", description: "Bug pattern analysis" }] },
  { name: "synthetic-data-designer", description: "Generate privacy-safe synthetic test data", category: "planning", templates: [{ name: "default", description: "Synthetic data generation" }] },
  { name: "playwright-test-generator", description: "Explore app and generate Playwright tests", category: "playwright", templates: [{ name: "default", description: "Playwright test generation" }] },
  { name: "playwright-executor", description: "Run Playwright tests, diagnose failures", category: "playwright", templates: [{ name: "default", description: "Playwright execution" }] },
  { name: "exploratory-tester", description: "Explore web app and generate structured test cases", category: "reporting", templates: [{ name: "default", description: "Exploratory testing" }] },
  { name: "report-creator", description: "Generate HTML/markdown test execution reports", category: "reporting", templates: [{ name: "default", description: "Report generation" }] },
  { name: "security-scout", description: "Scan for vulnerabilities and dangerous patterns", category: "analysis", templates: [{ name: "default", description: "Security audit" }] },
  { name: "coverage-hunter", description: "Identify test coverage gaps", category: "analysis", templates: [{ name: "default", description: "Coverage analysis" }] },
];

const FALLBACK_WORKFLOWS: Record<string, any> = {
  "feature-testing": { name: "New Feature Testing", description: "End-to-end from requirements to test report", steps: [] },
  "pbi-to-report": { name: "PBI to Report — Full Pipeline", description: "Analyze PBI, generate tests, execute, and report", steps: [] },
  "playwright-gen": { name: "Playwright Test Generation", description: "Generate Playwright tests with POM pattern", steps: [] },
};

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------
function loadModelProfiles(): string[] {
  try {
    const ecoPath = getEcosystemPath();
    const modelsPath = path.join(ecoPath, "qa_ecosystem", "models.yaml");
    if (fs.existsSync(modelsPath)) {
      const raw = fs.readFileSync(modelsPath, "utf-8");
      const parsed = yaml.load(raw) as any;
      return Object.keys(parsed?.profiles || {});
    }
  } catch (_) {}
  return ["claude-sonnet-api", "claude-opus-api", "copilot-gpt4o", "copilot-o3-mini", "gpt-4o", "ollama-llama3"];
}

// ---------------------------------------------------------------------------
// Subprocess runner
// ---------------------------------------------------------------------------
function startRun(runId: number, type: "agent" | "workflow", name: string, input: string, model?: string): void {
  const ecoPath = getEcosystemPath();

  // Write input to temp file
  const tmpFile = path.join(os.tmpdir(), `qa-ui-input-${runId}-${Date.now()}.md`);
  fs.writeFileSync(tmpFile, input, "utf-8");

  const args = type === "agent"
    ? ["run", "--agent", name, "--input", tmpFile, ...(model ? ["--model", model] : [])]
    : ["workflow", name, "--input", tmpFile, ...(model ? ["--model", model] : [])];

  let proc: ChildProcess;
  try {
    proc = spawn("python", ["-m", "qa_ecosystem", ...args], {
      cwd: ecoPath,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err: any) {
    storage.updateRun(runId, {
      status: "failed",
      errorMessage: `Failed to start process: ${err.message}`,
      completedAt: new Date().toISOString(),
    });
    broadcastToClients(runId, `[ERROR] Failed to start: ${err.message}\n`);
    sendDoneEvent(runId, "failed");
    fs.unlinkSync(tmpFile);
    return;
  }

  runningProcesses.set(runId, proc);
  storage.updateRun(runId, { status: "running" });

  proc.stdout?.on("data", (chunk) => {
    const text = chunk.toString();
    broadcastToClients(runId, text);
  });

  proc.stderr?.on("data", (chunk) => {
    const text = chunk.toString();
    broadcastToClients(runId, `[stderr] ${text}`);
  });

  proc.on("close", (code) => {
    runningProcesses.delete(runId);
    const fullOutput = outputBuffers.get(runId) || "";
    outputBuffers.delete(runId);
    const status = code === 0 ? "completed" : "failed";
    storage.updateRun(runId, {
      status,
      output: fullOutput,
      completedAt: new Date().toISOString(),
      errorMessage: code !== 0 ? `Process exited with code ${code}` : undefined,
    });
    sendDoneEvent(runId, status);
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  });

  proc.on("error", (err) => {
    runningProcesses.delete(runId);
    storage.updateRun(runId, {
      status: "failed",
      errorMessage: err.message,
      completedAt: new Date().toISOString(),
    });
    sendDoneEvent(runId, "failed");
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  });
}

// ---------------------------------------------------------------------------
// Reports browser
// ---------------------------------------------------------------------------
interface ReportFile {
  path: string;
  name: string;
  agent: string;
  sizeBytes: number;
  modifiedAt: string;
  ext: string;
}

function listReports(): { agent: string; files: ReportFile[] }[] {
  const outputsDir = getOutputsDir();
  if (!fs.existsSync(outputsDir)) return [];
  const result: { agent: string; files: ReportFile[] }[] = [];
  const agentDirs = fs.readdirSync(outputsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const agent of agentDirs) {
    const agentDir = path.join(outputsDir, agent);
    const files = fs.readdirSync(agentDir, { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => {
        const fullPath = path.join(agentDir, f.name);
        const stat = fs.statSync(fullPath);
        const relPath = path.join(agent, f.name);
        return {
          path: relPath,
          name: f.name,
          agent,
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          ext: path.extname(f.name).toLowerCase(),
        } as ReportFile;
      })
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    if (files.length > 0) result.push({ agent, files });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------
export function registerRoutes(httpServer: Server, app: Express): void {

  // ── JWT Secret ──────────────────────────────────────────────────────────
  // Store JWT secret in DB so it survives restarts without losing sessions
  let jwtSecret = storage.getSetting("jwtSecret");
  if (!jwtSecret) {
    jwtSecret = require("crypto").randomBytes(48).toString("hex");
    storage.setSetting("jwtSecret", jwtSecret);
  }
  initJwtSecret(jwtSecret);

  // ── Seed master admin account on first start ──────────────────────────────
  if (storage.getUserCount() === 0) {
    hashPassword("admin").then((hash) => {
      storage.createUser({
        username: "admin",
        passwordHash: hash,
        role: "admin",
        isActive: true,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      });
    });
  }

  // ── Auth Routes (PUBLIC — no token required) ─────────────────────────────

  /** POST /api/auth/login */
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }
    const user = storage.getUserByUsername(username);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    storage.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    setAuthCookie(res, token);
    res.json({ user: safeUser(user), token });
  });

  /** POST /api/auth/logout */
  app.post("/api/auth/logout", (req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  });

  /** GET /api/auth/me — returns current user from token */
  app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
    const user = storage.getUserById(req.user!.userId);
    if (!user || !user.isActive) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "User not found or deactivated" });
    }
    res.json(safeUser(user));
  });

  /** POST /api/auth/change-password — allowed even when mustChangePassword=true */
  app.post("/api/auth/change-password", requireAuth, async (req: AuthRequest, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    const user = storage.getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Prevent reusing the default password (username as password)
    const isSameAsUsername = await verifyPassword(newPassword, await hashPassword(user.username)
      .then(() => "").catch(() => "")) || newPassword === user.username;
    if (isSameAsUsername) {
      return res.status(400).json({ error: "New password cannot be the same as your username" });
    }
    const passwordHash = await hashPassword(newPassword);
    const updated = storage.updateUser(user.id, { passwordHash, mustChangePassword: false });
    res.json(safeUser(updated!));
  });

  // ── User Management (admin only) ──────────────────────────────────────────

  app.get("/api/users", requireAdmin, (_req, res) => {
    res.json(storage.getAllUsers().map(safeUser));
  });

  app.post("/api/users", requireAdmin, async (req: AuthRequest, res) => {
    const { username, password, role } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: "username is required" });
    }
    const trimmed = username.trim().toLowerCase();
    if (storage.getUserByUsername(trimmed)) {
      return res.status(409).json({ error: "Username already taken" });
    }
    // Default password = username; admin may override
    const initialPassword = (password && password.length >= 6) ? password : trimmed;
    const passwordHash = await hashPassword(initialPassword);
    const allowedRoles = ["admin", "operator", "viewer"];
    const assignedRole = allowedRoles.includes(role) ? role : "viewer";
    const user = storage.createUser({
      username: trimmed,
      passwordHash,
      role: assignedRole,
      isActive: true,
      mustChangePassword: true,  // always force change on first login
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    });
    res.status(201).json(safeUser(user));
  });

  app.patch("/api/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    const targetId = Number(req.params.id);
    const target = storage.getUserById(targetId);
    if (!target) return res.status(404).json({ error: "User not found" });

    // Prevent admin from demoting or deactivating themselves
    if (targetId === req.user!.userId) {
      if (req.body.role && req.body.role !== "admin") {
        return res.status(400).json({ error: "Cannot change your own role" });
      }
      if (req.body.isActive === false) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
      }
    }

    const updates: any = {};
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.password && req.body.password.length >= 6) {
      updates.passwordHash = await hashPassword(req.body.password);
      updates.mustChangePassword = true; // admin-reset password → user must change again
    }

    const updated = storage.updateUser(targetId, updates);
    res.json(safeUser(updated!));
  });

  app.delete("/api/users/:id", requireAdmin, (req: AuthRequest, res) => {
    const targetId = Number(req.params.id);
    if (targetId === req.user!.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const target = storage.getUserById(targetId);
    if (!target) return res.status(404).json({ error: "User not found" });
    storage.deleteUser(targetId);
    res.json({ ok: true });
  });

  // ── All routes below require authentication ────────────────────────────────
  app.use("/api/", requireAuth);

  // Seed default settings
  if (!storage.getSetting("ecosystemPath")) {
    const defaultPath = path.resolve(path.join(__dirname, "../../qa-agent-repo"));
    if (fs.existsSync(defaultPath)) {
      storage.setSetting("ecosystemPath", defaultPath);
    }
  }
  if (!storage.getSetting("pythonCommand")) {
    storage.setSetting("pythonCommand", "python");
  }

  // ── Agents ──────────────────────────────────────────────────────────────
  app.get("/api/agents", (_req, res) => {
    res.json(loadAgents());
  });

  // ── Workflows ────────────────────────────────────────────────────────────
  app.get("/api/workflows", (_req, res) => {
    const wfs = loadWorkflows();
    const result = Object.entries(wfs).map(([key, wf]: [string, any]) => ({
      key,
      name: wf.name,
      description: wf.description,
      steps: wf.steps || [],
    }));
    res.json(result);
  });

  // ── Models ───────────────────────────────────────────────────────────────
  app.get("/api/models", (_req, res) => {
    res.json(loadModelProfiles());
  });

  // ── Runs ─────────────────────────────────────────────────────────────────
  app.get("/api/runs", (_req, res) => {
    res.json(storage.getRuns());
  });

  app.get("/api/runs/:id", (req, res) => {
    const run = storage.getRun(Number(req.params.id));
    if (!run) return res.status(404).json({ error: "Run not found" });
    res.json(run);
  });

  app.post("/api/runs", (req: Request, res: Response) => {
    const { type, name, input, model } = req.body;
    if (!type || !name || !input) {
      return res.status(400).json({ error: "type, name, and input are required" });
    }
    const run = storage.createRun({
      type,
      name,
      input,
      model: model || null,
      status: "pending",
      output: "",
      outputPath: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      errorMessage: null,
    });
    // Start in background
    setImmediate(() => startRun(run.id, type, name, input, model));
    res.json(run);
  });

  app.post("/api/runs/:id/stop", (req, res) => {
    const runId = Number(req.params.id);
    const proc = runningProcesses.get(runId);
    if (proc) {
      proc.kill("SIGTERM");
      runningProcesses.delete(runId);
      storage.updateRun(runId, {
        status: "stopped",
        completedAt: new Date().toISOString(),
      });
      sendDoneEvent(runId, "stopped");
    }
    res.json({ ok: true });
  });

  // ── SSE Stream ───────────────────────────────────────────────────────────
  app.get("/api/runs/:id/stream", (req, res) => {
    const runId = Number(req.params.id);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    const run = storage.getRun(runId);
    if (!run) {
      res.write(`event: done\ndata: ${JSON.stringify({ status: "not_found" })}\n\n`);
      res.end();
      return;
    }

    // Send already-buffered output for reconnects
    const buffered = outputBuffers.get(runId);
    if (buffered) {
      const lines = buffered.split("\n");
      for (const line of lines) {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    } else if (run.output) {
      const lines = run.output.split("\n");
      for (const line of lines) {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    }

    // If already finished, send done immediately
    if (run.status !== "running" && run.status !== "pending") {
      res.write(`event: done\ndata: ${JSON.stringify({ status: run.status })}\n\n`);
      res.end();
      return;
    }

    // Register SSE client
    const clients = sseClients.get(runId) || [];
    clients.push(res);
    sseClients.set(runId, clients);

    // Heartbeat
    const hb = setInterval(() => {
      try { res.write(": heartbeat\n\n"); } catch (_) { clearInterval(hb); }
    }, 15000);

    req.on("close", () => {
      clearInterval(hb);
      const remaining = (sseClients.get(runId) || []).filter((r) => r !== res);
      if (remaining.length > 0) sseClients.set(runId, remaining);
      else sseClients.delete(runId);
    });
  });

  // ── Reports ──────────────────────────────────────────────────────────────
  app.get("/api/reports", (_req, res) => {
    res.json(listReports());
  });

  app.get("/api/reports/content", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) return res.status(400).json({ error: "path required" });
    const fullPath = path.join(getOutputsDir(), relPath);
    if (!fullPath.startsWith(getOutputsDir())) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "Not found" });
    const content = fs.readFileSync(fullPath, "utf-8");
    res.json({ content, ext: path.extname(fullPath).toLowerCase() });
  });

  app.get("/api/reports/download", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) return res.status(400).json({ error: "path required" });
    const fullPath = path.join(getOutputsDir(), relPath);
    if (!fullPath.startsWith(getOutputsDir())) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "Not found" });
    res.download(fullPath);
  });

  // ── Settings ─────────────────────────────────────────────────────────────
  app.get("/api/settings", (_req, res) => {
    const all = storage.getAllSettings();
    const obj: Record<string, string> = {};
    for (const s of all) obj[s.key] = s.value;
    res.json(obj);
  });

  app.post("/api/settings", (req, res) => {
    const body = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      storage.setSetting(key, value);
    }
    res.json({ ok: true });
  });

  // ── Health ────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    const ecoPath = getEcosystemPath();
    const hasEco = fs.existsSync(path.join(ecoPath, "qa_ecosystem"));
    const outputsDir = getOutputsDir();
    const hasOutputs = fs.existsSync(outputsDir);
    res.json({
      ok: true,
      ecosystemPath: ecoPath,
      ecosystemFound: hasEco,
      outputsDirFound: hasOutputs,
    });
  });
}
