import fs from "fs";
import path from "path";
import { execFileSync, execSync } from "child_process";
import YAML from "yaml";

const USER_HOME = process.env.HOME || "";
export const HERMES_DIR = process.env.HERMES_DIR || `${USER_HOME}/.hermes`;
const HERMES_AGENT_DIR = path.join(HERMES_DIR, "hermes-agent");
const LAUNCH_AGENTS_DIR = path.join(USER_HOME, "Library/LaunchAgents");
const HERMES_GATEWAY_PLIST = /^ai\..+\.gateway\.plist$/;
const CACHE_TTL_MS = 5000;
const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const memoCache = new Map<string, { expiresAt: number; value: unknown }>();

function getPythonPath() {
  return path.join(HERMES_AGENT_DIR, "venv/bin/python");
}

function getDefaultExecOptions(timeout = 15000, homeDir = HERMES_DIR) {
  return {
    encoding: "utf-8" as const,
    timeout,
    cwd: HERMES_AGENT_DIR,
    env: { ...process.env, HOME: process.env.HOME, HERMES_HOME: homeDir },
  };
}

function runHermesPython(script: string, timeout = 30000, homeDir = HERMES_DIR) {
  return execFileSync(getPythonPath(), ["-"], {
    ...getDefaultExecOptions(timeout, homeDir),
    input: script,
  });
}

function runHermesCli(args: string[], timeout = 30000, homeDir = HERMES_DIR) {
  return String(execFileSync(getPythonPath(), args, getDefaultExecOptions(timeout, homeDir)));
}

function memoize<T>(key: string, compute: () => T, ttlMs = CACHE_TTL_MS): T {
  const now = Date.now();
  const cached = memoCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const value = compute();
  memoCache.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

export interface HermesChatResult {
  reply: string;
  sessionId: string;
}

interface HermesChatOptions {
  message: string;
  sessionId?: string;
  model?: string;
  provider?: string;
}

export function chatWithHermesCli({
  message,
  sessionId,
  model,
  provider,
}: HermesChatOptions): HermesChatResult {
  const args = ["-m", "hermes_cli.main", "chat", "-Q", "--source", "tool", "-q", message];

  if (sessionId) {
    args.push("--resume", sessionId);
  }

  // Default dashboard mode should follow the user's normal Hermes TUI config.
  // Only override the runtime when a non-default model is explicitly selected.
  if (model && model !== "gpt-5.4") {
    args.push("-m", model);
  }

  if (provider && provider !== "openai-codex") {
    args.push("--provider", provider);
  }

  const rawOutput = execFileSync(getPythonPath(), args, getDefaultExecOptions(180000));
  const output = String(rawOutput).replace(/\r\n/g, "\n").trim();
  const lines = output.split("\n");
  const sessionLine = [...lines].reverse().find((line) => line.startsWith("session_id: "));

  if (!sessionLine) {
    throw new Error("Hermes chat did not return a session ID");
  }

  const parsedSessionId = sessionLine.replace("session_id: ", "").trim();
  const replyLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("session_id: ")) return false;
    if (trimmed.startsWith("↻ Resumed session ")) return false;
    return true;
  });

  return {
    reply: replyLines.join("\n").trim() || "No response received from Hermes.",
    sessionId: parsedSessionId,
  };
}

export interface GatewayState {
  pid: number;
  kind: string;
  gateway_state: string;
  start_time: string | null;
  exit_reason: string | null;
  platforms: Record<string, GatewayPlatformState>;
  updated_at: string;
}

export interface GatewayPlatformState {
  state: string;
  updated_at: string;
  error_code?: string;
  error_message?: string;
}

export function readGatewayState(homeDir = HERMES_DIR): GatewayState | null {
  try {
    const data = fs.readFileSync(path.join(homeDir, "gateway_state.json"), "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export interface CronJob {
  id: string;
  name: string;
  status: string;
  schedule: string;
  repeat: string;
  nextRun: string;
  deliver: string;
  skills: string[];
  instance: string;
  instanceLabel: string;
  homeDir: string;
}

export function listCronJobs(homeDir = HERMES_DIR): CronJob[] {
  return memoize(`cron:${homeDir}`, () => {
    try {
      const output = runHermesCli(["-m", "hermes_cli.main", "cron", "list"], 15000, homeDir);
      return parseCronOutput(output, homeDir);
    } catch {
      return [];
    }
  });
}

export function listCronJobsAcrossInstances(): CronJob[] {
  return memoize("cron:all", () => {
    const jobs = listHermesInstances().flatMap((instance) =>
      listCronJobs(instance.homeDir).map((job) => ({
        ...job,
        instance: instance.name,
        instanceLabel: instance.label,
        homeDir: instance.homeDir,
      }))
    );

    return jobs.sort((a, b) => {
      const statusRank = (status: string) => {
        switch (status) {
          case "active": return 0;
          case "paused": return 1;
          case "completed": return 2;
          default: return 3;
        }
      };

      const rankDiff = statusRank(a.status) - statusRank(b.status);
      if (rankDiff !== 0) return rankDiff;

      const aTime = Date.parse(a.nextRun || "");
      const bTime = Date.parse(b.nextRun || "");
      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
        return aTime - bTime;
      }

      if (a.instance !== b.instance) {
        return a.instance.localeCompare(b.instance);
      }

      return a.name.localeCompare(b.name);
    });
  });
}

function parseCronOutput(output: string, homeDir = HERMES_DIR): CronJob[] {
  const jobs: CronJob[] = [];
  let current: Partial<CronJob> = {};
  const { instanceName, instanceLabel } = getInstanceIdentity(homeDir);

  for (const line of output.split("\n")) {
    const trimmed = line.trim();

    const idMatch = trimmed.match(/^([a-f0-9]{8,})\s+\[(active|paused|completed)\]/);
    if (idMatch) {
      if (current.id) {
        jobs.push(current as CronJob);
      }
      current = {
        id: idMatch[1],
        status: idMatch[2],
        skills: [],
        instance: instanceName,
        instanceLabel,
        homeDir,
      };
      continue;
    }

    const kvMatch = trimmed.match(/^(\w[\w\s]*):\s+(.+)$/);
    if (kvMatch && current.id) {
      const key = kvMatch[1].trim().toLowerCase();
      const val = kvMatch[2].trim();
      switch (key) {
        case "name": current.name = val; break;
        case "schedule": current.schedule = val; break;
        case "repeat": current.repeat = val; break;
        case "next run": current.nextRun = val; break;
        case "deliver": current.deliver = val; break;
        case "skills": current.skills = val.split(",").map((s) => s.trim()); break;
      }
    }
  }
  if (current.id) {
    jobs.push(current as CronJob);
  }
  return jobs;
}

export interface SkillCategory {
  name: string;
  skills: SkillInfo[];
}

export interface SkillInfo {
  name: string;
  category: string;
  hasSkillMd: boolean;
  path: string;
}

export function listSkills(): SkillCategory[] {
  const skillsDir = path.join(HERMES_DIR, "skills");
  const categories: SkillCategory[] = [];

  try {
    const cats = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const cat of cats) {
      if (!cat.isDirectory() || cat.name.startsWith(".")) continue;

      const catPath = path.join(skillsDir, cat.name);
      const skills: SkillInfo[] = [];

      const entries = fs.readdirSync(catPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
        const skillPath = path.join(catPath, entry.name);
        const hasSkillMd = fs.existsSync(path.join(skillPath, "SKILL.md"));
        skills.push({
          name: entry.name,
          category: cat.name,
          hasSkillMd,
          path: skillPath,
        });
      }

      if (entries.some((e) => e.name === "SKILL.md")) {
        skills.unshift({
          name: cat.name,
          category: cat.name,
          hasSkillMd: true,
          path: catPath,
        });
      }

      if (skills.length > 0 || entries.some((e) => e.name === "DESCRIPTION.md")) {
        categories.push({ name: cat.name, skills });
      }
    }
  } catch {
    // skills dir may not exist
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export function readSkillMd(category: string, skill: string): string | null {
  const skillPath = path.join(HERMES_DIR, "skills", category, skill, "SKILL.md");
  try {
    return fs.readFileSync(skillPath, "utf-8");
  } catch {
    try {
      const catPath = path.join(HERMES_DIR, "skills", category, "SKILL.md");
      return fs.readFileSync(catPath, "utf-8");
    } catch {
      return null;
    }
  }
}

export function readConfig(): Record<string, unknown> | null {
  try {
    const data = fs.readFileSync(path.join(HERMES_DIR, "config.yaml"), "utf-8");
    return YAML.parse(data);
  } catch {
    return null;
  }
}

export function readEnvVars(): Array<{ key: string; value: string }> {
  try {
    const data = fs.readFileSync(path.join(HERMES_DIR, ".env"), "utf-8");
    const vars: Array<{ key: string; value: string }> = [];
    for (const line of data.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx);
      const value = trimmed.substring(eqIdx + 1);
      const isSensitive = /key|secret|token|password|api/i.test(key);
      vars.push({
        key,
        value: isSensitive && value.length > 4
          ? value.substring(0, 4) + "..." + value.substring(value.length - 4)
          : value || "(empty)",
      });
    }
    return vars;
  } catch {
    return [];
  }
}

export interface SessionFile {
  name: string;
  date: Date;
  size: number;
  isCron: boolean;
  path: string;
  instance: string;
  instanceLabel: string;
  homeDir: string;
}

export function listSessions(homeDir = HERMES_DIR): SessionFile[] {
  return memoize(`sessions:${homeDir}`, () => {
    const sessionsDir = path.join(homeDir, "sessions");
    const { instanceName, instanceLabel } = getInstanceIdentity(homeDir);

    try {
      const files = fs.readdirSync(sessionsDir);
      const sessions: SessionFile[] = [];
      for (const file of files) {
        if (!file.endsWith(".json") && !file.endsWith(".jsonl")) continue;
        const filePath = path.join(sessionsDir, file);
        const stat = fs.statSync(filePath);
        sessions.push({
          name: file,
          date: stat.mtime,
          size: stat.size,
          isCron: file.startsWith("session_cron_"),
          path: filePath,
          instance: instanceName,
          instanceLabel,
          homeDir,
        });
      }
      return sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch {
      return [];
    }
  });
}

export function listSessionsAcrossInstances(): SessionFile[] {
  return memoize("sessions:all", () =>
    listHermesInstances()
      .flatMap((instance) => listSessions(instance.homeDir))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  );
}

export interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
  tool_calls?: unknown[];
}

export function readSession(filename: string, homeDir = HERMES_DIR): SessionMessage[] {
  const sessionsDir = path.join(homeDir, "sessions");
  const filePath = path.join(sessionsDir, filename);

  // Prevent path traversal
  if (!filePath.startsWith(sessionsDir)) return [];

  try {
    const data = fs.readFileSync(filePath, "utf-8");

    if (filename.endsWith(".jsonl")) {
      const messages: SessionMessage[] = [];
      for (const line of data.split("\n")) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.role && parsed.content) {
            messages.push({
              role: parsed.role,
              content: typeof parsed.content === "string" ? parsed.content : JSON.stringify(parsed.content),
              timestamp: parsed.timestamp,
            });
          }
        } catch {
          // skip malformed lines
        }
      }
      return messages;
    }

    // JSON file
    const parsed = JSON.parse(data);

    // Handle different session formats
    if (Array.isArray(parsed)) {
      return parsed
        .filter((m: Record<string, unknown>) => m.role && m.content)
        .map((m: Record<string, unknown>) => ({
          role: String(m.role),
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          timestamp: m.timestamp ? String(m.timestamp) : undefined,
        }));
    }

    // Object with messages array
    if (parsed.messages && Array.isArray(parsed.messages)) {
      return parsed.messages
        .filter((m: Record<string, unknown>) => m.role && m.content)
        .map((m: Record<string, unknown>) => ({
          role: String(m.role),
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          timestamp: m.timestamp ? String(m.timestamp) : undefined,
        }));
    }

    // Object with conversation_history
    if (parsed.conversation_history && Array.isArray(parsed.conversation_history)) {
      return parsed.conversation_history
        .filter((m: Record<string, unknown>) => m.role && m.content)
        .map((m: Record<string, unknown>) => ({
          role: String(m.role),
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          timestamp: m.timestamp ? String(m.timestamp) : undefined,
        }));
    }

    return [];
  } catch {
    return [];
  }
}

export interface LogEntry {
  name: string;
  size: number;
  modified: Date;
  tail: string;
  path: string;
  instance: string;
  instanceLabel: string;
  homeDir: string;
}

export function listLogs(homeDir = HERMES_DIR): LogEntry[] {
  return memoize(`logs:${homeDir}`, () => {
    const logsDir = path.join(homeDir, "logs");
    const { instanceName, instanceLabel } = getInstanceIdentity(homeDir);

    try {
      const files = fs.readdirSync(logsDir);
      const logs: LogEntry[] = [];
      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stat = fs.statSync(filePath);
        let tail = "";
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const lines = content.split("\n");
          tail = lines.slice(-50).join("\n");
        } catch {
          tail = "(unable to read)";
        }
        logs.push({
          name: file,
          size: stat.size,
          modified: stat.mtime,
          tail,
          path: filePath,
          instance: instanceName,
          instanceLabel,
          homeDir,
        });
      }
      return logs.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch {
      return [];
    }
  });
}

export function listLogsAcrossInstances(): LogEntry[] {
  return memoize("logs:all", () =>
    listHermesInstances()
      .flatMap((instance) => listLogs(instance.homeDir))
      .sort((a, b) => b.modified.getTime() - a.modified.getTime())
  );
}

export function gatewayControl(action: "restart" | "stop"): { success: boolean; message: string } {
  try {
    const cmd = action === "restart" ? "gateway restart" : "gateway stop";
    execSync(`${shellQuote(getPythonPath())} -m hermes_cli.main ${cmd} 2>&1`, getDefaultExecOptions(20000));
    return { success: true, message: `Gateway ${action} initiated` };
  } catch (err) {
    return { success: false, message: `Failed to ${action} gateway: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function createCronJob(input: {
  schedule: string;
  prompt: string;
  name?: string;
  deliver?: string;
  repeat?: string;
  skills?: string[];
}): { success: boolean; message: string } {
  try {
    const args: string[] = ["-m", "hermes_cli.main", "cron", "create"];

    if (input.name) args.push("--name", input.name);
    if (input.deliver) args.push("--deliver", input.deliver);
    if (input.repeat) args.push("--repeat", input.repeat);
    for (const skill of input.skills || []) {
      if (skill.trim()) args.push("--skill", skill.trim());
    }

    args.push(input.schedule, input.prompt);

    const command = `${shellQuote(getPythonPath())} ${args.map(shellQuote).join(" ")}`;
    execSync(command, getDefaultExecOptions(20000));
    return { success: true, message: "Cron job created" };
  } catch (err) {
    return {
      success: false,
      message: `Failed to create cron job: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

export function createProfile(input: {
  profileName: string;
  clone?: boolean;
}): { success: boolean; message: string } {
  try {
    const args: string[] = ["-m", "hermes_cli.main", "profile", "create"];
    if (input.clone) args.push("--clone");
    args.push(input.profileName);

    const command = `${shellQuote(getPythonPath())} ${args.map(shellQuote).join(" ")}`;
    execSync(command, getDefaultExecOptions(20000));
    return { success: true, message: "Profile created" };
  } catch (err) {
    return {
      success: false,
      message: `Failed to create profile: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

export function cronAction(action: "pause" | "resume" | "run" | "remove", jobId: string, homeDir = HERMES_DIR): { success: boolean; message: string } {
  try {
    runHermesCli(["-m", "hermes_cli.main", "cron", action, jobId], 20000, homeDir);
    return { success: true, message: `Cron job ${action}d` };
  } catch (err) {
    return {
      success: false,
      message: `Failed to ${action} cron job: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

export interface ProfileInfo {
  name: string;
  model: string;
  gateway: string;
  alias: string;
  active: boolean;
  path: string;
  skillCount: number;
  provider: string;
}

export interface HermesInstanceInfo {
  label: string;
  name: string;
  homeDir: string;
  launchAgentPath: string;
  gateway: "running" | "stopped" | "not loaded";
  pid: number | null;
  model: string;
  provider: string;
  skillCount: number;
  sessionCount: number;
  cronJobCount: number;
  activeCronCount: number;
  platformCount: number;
  updatedAt: string | null;
  gatewayState: string;
  primary: boolean;
}

export interface HermesFleetSummary {
  state: string;
  runningInstances: number;
  totalInstances: number;
  connectedPlatforms: number;
  activeJobs: number;
  totalJobs: number;
  updatedAt: string | null;
}

export interface PlatformConnectionInfo {
  instance: string;
  instanceLabel: string;
  platform: string;
  state: string;
  gatewayState: string;
  updatedAt: string | null;
  detail: string | null;
  hasError: boolean;
}

export function listHermesInstances(): HermesInstanceInfo[] {
  return memoize("instances", () => {
    const instances = discoverHermesLaunchAgents();

    return instances.map((instance) => {
      const launchd = readLaunchdService(instance.label);
      const gatewayState = readGatewayState(instance.homeDir);
      const { model, provider } = readProfileModel(instance.homeDir);
      const cronJobs = listCronJobs(instance.homeDir);
      const sessions = listSessions(instance.homeDir);

      return {
        label: instance.label,
        name: instance.name,
        homeDir: instance.homeDir,
        launchAgentPath: instance.launchAgentPath,
        gateway: launchd.state,
        pid: launchd.pid,
        model: model || "—",
        provider: provider || "—",
        skillCount: countProfileSkills(instance.homeDir),
        sessionCount: sessions.length,
        cronJobCount: cronJobs.length,
        activeCronCount: cronJobs.filter((job) => job.status === "active").length,
        platformCount: Object.keys(gatewayState?.platforms || {}).length,
        updatedAt: gatewayState?.updated_at || null,
        gatewayState: gatewayState?.gateway_state || launchd.state,
        primary: instance.homeDir === HERMES_DIR,
      };
    });
  });
}

export function getHermesFleetSummary(): HermesFleetSummary {
  return memoize("fleet:summary", () => {
    const instances = listHermesInstances();
    const cronJobs = listCronJobsAcrossInstances();
    const primaryState = readGatewayState();
    const runningInstances = instances.filter((instance) => instance.gateway === "running").length;
    const connectedPlatforms = instances.reduce((total, instance) => total + instance.platformCount, 0);

    return {
      state: primaryState?.gateway_state || (runningInstances > 0 ? "running" : "unknown"),
      runningInstances,
      totalInstances: instances.length,
      connectedPlatforms,
      activeJobs: cronJobs.filter((job) => job.status === "active").length,
      totalJobs: cronJobs.length,
      updatedAt: primaryState?.updated_at || instances[0]?.updatedAt || null,
    };
  });
}

export function listPlatformConnectionsAcrossInstances(): PlatformConnectionInfo[] {
  return memoize("platforms:all", () => {
    const connections: PlatformConnectionInfo[] = [];

    for (const instance of listHermesInstances()) {
      const gatewayState = readGatewayState(instance.homeDir);
      const platforms = gatewayState?.platforms || {};

      for (const [platform, info] of Object.entries(platforms)) {
        const normalized = normalizePlatformState({
          homeDir: instance.homeDir,
          platform,
          info,
          gatewayState,
        });

        connections.push({
          instance: instance.name,
          instanceLabel: instance.label,
          platform,
          state: normalized.state,
          gatewayState: gatewayState?.gateway_state || instance.gatewayState,
          updatedAt: info.updated_at || gatewayState?.updated_at || null,
          detail: normalized.detail,
          hasError: normalized.hasError,
        });
      }
    }

    return connections.sort((a, b) => {
      if (a.platform !== b.platform) {
        if (a.platform === "telegram") return -1;
        if (b.platform === "telegram") return 1;
        return a.platform.localeCompare(b.platform);
      }

      if (a.state !== b.state) {
        const rank = (value: string) => {
          switch (value) {
            case "connected": return 0;
            case "running": return 1;
            case "inactive": return 2;
            case "disconnected": return 3;
            case "error": return 4;
            default: return 5;
          }
        };
        return rank(a.state) - rank(b.state);
      }

      return a.instance.localeCompare(b.instance);
    });
  });
}

export function listProfiles(): ProfileInfo[] {
  const profiles: ProfileInfo[] = [];
  const profilesRoot = path.join(HERMES_DIR, "profiles");
  const wrapperDir = path.join(process.env.HOME || "", ".local/bin");
  const activeProfile = readActiveProfileName();

  const pushProfile = (name: string, profileDir: string) => {
    if (!fs.existsSync(profileDir)) return;
    const { model, provider } = readProfileModel(profileDir);
    profiles.push({
      name,
      model: model || "—",
      provider: provider || "—",
      gateway: isGatewayRunning(profileDir) ? "running" : "stopped",
      alias: name !== "default" && fs.existsSync(path.join(wrapperDir, name)) ? name : "—",
      active: activeProfile === name,
      path: profileDir,
      skillCount: countProfileSkills(profileDir),
    });
  };

  pushProfile("default", HERMES_DIR);

  try {
    if (fs.existsSync(profilesRoot)) {
      for (const entry of fs.readdirSync(profilesRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isDirectory()) continue;
        pushProfile(entry.name, path.join(profilesRoot, entry.name));
      }
    }
  } catch {
    return profiles;
  }

  return profiles;
}

export function useProfile(profileName: string): { success: boolean; message: string } {
  try {
    const command = `${shellQuote(getPythonPath())} -m hermes_cli.main profile use ${shellQuote(profileName)}`;
    execSync(command, getDefaultExecOptions(20000));
    return { success: true, message: `Profile ${profileName} is now active` };
  } catch (err) {
    return {
      success: false,
      message: `Failed to switch profile: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

export interface SkillSearchResult {
  name: string;
  description: string;
  source: string;
  trust: string;
  identifier: string;
}

export function searchSkills(query: string, limit = 8): SkillSearchResult[] {
  try {
    const output = runHermesPython(`
import json
from tools.skills_hub import GitHubAuth, create_source_router, unified_search

query = ${JSON.stringify(query)}
limit = ${JSON.stringify(limit)}
auth = GitHubAuth()
sources = create_source_router(auth)
results = unified_search(query, sources, source_filter="all", limit=limit)
payload = []
for result in results:
    payload.append({
        "name": result.name,
        "description": result.description,
        "source": result.source,
        "trust": result.trust_level,
        "identifier": result.identifier,
    })
print(json.dumps(payload, ensure_ascii=False))
`);
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function installSkill(identifier: string, category?: string): { success: boolean; message: string } {
  try {
    const args = ["-m", "hermes_cli.main", "skills", "install", identifier, "--yes"];
    if (category) args.push("--category", category);
    const command = `${shellQuote(getPythonPath())} ${args.map(shellQuote).join(" ")}`;
    execSync(command, getDefaultExecOptions(60000));
    return { success: true, message: `Installed ${identifier}` };
  } catch (err) {
    return {
      success: false,
      message: `Failed to install skill: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

function readActiveProfileName() {
  try {
    const activePath = path.join(HERMES_DIR, "active_profile");
    const raw = fs.readFileSync(activePath, "utf-8").trim();
    return raw || "default";
  } catch {
    return "default";
  }
}

function readProfileModel(profileDir: string) {
  try {
    const config = YAML.parse(fs.readFileSync(path.join(profileDir, "config.yaml"), "utf-8")) || {};
    const modelConfig = config.model;
    if (typeof modelConfig === "string") {
      return { model: modelConfig, provider: "" };
    }
    if (modelConfig && typeof modelConfig === "object") {
      const record = modelConfig as Record<string, unknown>;
      return {
        model: String(record.model || record.default || ""),
        provider: String(record.provider || ""),
      };
    }
  } catch {
    // ignore config errors
  }
  return { model: "", provider: "" };
}

function discoverHermesLaunchAgents() {
  const discovered = new Map<string, { label: string; name: string; homeDir: string; launchAgentPath: string }>();

  try {
    for (const file of fs.readdirSync(LAUNCH_AGENTS_DIR)) {
      if (!HERMES_GATEWAY_PLIST.test(file)) continue;

      const launchAgentPath = path.join(LAUNCH_AGENTS_DIR, file);
      const xml = fs.readFileSync(launchAgentPath, "utf-8");

      if (!xml.includes("hermes_cli.main")) continue;

      const homeDir = readPlistString(xml, "HERMES_HOME");
      const label = readPlistString(xml, "Label") || file.replace(/\.plist$/, "");

      if (!homeDir || !homeDir.startsWith(`${USER_HOME}/.hermes`)) continue;

      const name = label.replace(/^ai\./, "").replace(/\.gateway$/, "") || path.basename(homeDir);
      discovered.set(homeDir, { label, name, homeDir, launchAgentPath });
    }
  } catch {
    // ignore discovery failures
  }

  if (!discovered.has(HERMES_DIR)) {
    discovered.set(HERMES_DIR, {
      label: "ai.hermes.gateway",
      name: "hermes",
      homeDir: HERMES_DIR,
      launchAgentPath: path.join(LAUNCH_AGENTS_DIR, "ai.hermes.gateway.plist"),
    });
  }

  return [...discovered.values()].sort((a, b) => {
    if (a.homeDir === HERMES_DIR) return -1;
    if (b.homeDir === HERMES_DIR) return 1;
    return a.name.localeCompare(b.name);
  });
}

function getInstanceIdentity(homeDir: string) {
  const instanceName =
    homeDir === HERMES_DIR ? "hermes" : path.basename(homeDir).replace(/^\.hermes-?/, "") || "hermes";
  const instanceLabel = instanceName === "hermes" ? "ai.hermes.gateway" : `ai.${instanceName}.gateway`;
  return { instanceName, instanceLabel };
}

export function resolveHermesHome(homeDir?: string | null) {
  if (!homeDir) return HERMES_DIR;
  const normalized = homeDir.trim();
  if (!normalized) return HERMES_DIR;
  const match = listHermesInstances().find((instance) => instance.homeDir === normalized);
  return match?.homeDir || null;
}

function sanitizePlatformMessage(message?: string) {
  if (!message) return "";
  return message
    .replace(/\b\d{8,}:[A-Za-z0-9_-]{20,}\b/g, "[redacted-token]")
    .trim();
}

function normalizePlatformState({
  homeDir,
  platform,
  info,
  gatewayState,
}: {
  homeDir: string;
  platform: string;
  info: GatewayPlatformState;
  gatewayState: GatewayState | null;
}) {
  const rawState = (info.state || "unknown").toLowerCase();
  const sanitizedMessage = sanitizePlatformMessage(info.error_message);

  if (rawState === "connected" || rawState === "running") {
    return {
      state: rawState,
      detail: null,
      hasError: false,
    };
  }

  if (platform === "api_server" && !isApiServerEnabled(homeDir)) {
    return {
      state: "inactive",
      detail: "not enabled",
      hasError: false,
    };
  }

  if (info.error_code || sanitizedMessage) {
    return {
      state: "error",
      detail: info.error_code ? info.error_code.replace(/_/g, " ") : sanitizedMessage || null,
      hasError: true,
    };
  }

  if (
    rawState === "disconnected" &&
    gatewayState?.updated_at &&
    info.updated_at &&
    Date.parse(gatewayState.updated_at) - Date.parse(info.updated_at) > 1000 * 60 * 60
  ) {
    return {
      state: "inactive",
      detail: "stale status",
      hasError: false,
    };
  }

  return {
    state: rawState,
    detail: null,
    hasError: false,
  };
}

function isApiServerEnabled(homeDir: string) {
  const envVars = readRawEnvVars(homeDir);
  const enabledValue = envVars.get("API_SERVER_ENABLED");
  const keyValue = envVars.get("API_SERVER_KEY");
  if (enabledValue && TRUE_VALUES.has(enabledValue.trim().toLowerCase())) {
    return true;
  }
  if (keyValue && keyValue.trim()) {
    return true;
  }

  try {
    const config = YAML.parse(fs.readFileSync(path.join(homeDir, "config.yaml"), "utf-8")) || {};
    const platforms = typeof config === "object" && config ? (config as Record<string, unknown>).platforms : null;
    const apiServer =
      platforms && typeof platforms === "object"
        ? (platforms as Record<string, unknown>).api_server
        : null;

    if (apiServer && typeof apiServer === "object") {
      const enabled = (apiServer as Record<string, unknown>).enabled;
      if (typeof enabled === "boolean") return enabled;
      if (typeof enabled === "string") return TRUE_VALUES.has(enabled.trim().toLowerCase());
      return true;
    }
  } catch {
    // ignore config parse failures
  }

  return false;
}

function readRawEnvVars(homeDir: string) {
  const values = new Map<string, string>();

  try {
    const data = fs.readFileSync(path.join(homeDir, ".env"), "utf-8");
    for (const line of data.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      values.set(trimmed.substring(0, eqIdx), trimmed.substring(eqIdx + 1));
    }
  } catch {
    // ignore missing env files
  }

  return values;
}

function readLaunchdService(label: string): { state: "running" | "stopped" | "not loaded"; pid: number | null } {
  try {
    const uid = typeof process.getuid === "function" ? String(process.getuid()) : "501";
    const output = String(execFileSync("/bin/launchctl", ["print", `gui/${uid}/${label}`], {
      encoding: "utf-8",
      timeout: 5000,
      env: { ...process.env, HOME: USER_HOME },
    }));
    const stateMatch = output.match(/state = ([^\n]+)/);
    const pidMatch = output.match(/pid = (\d+)/);
    const state = stateMatch?.[1]?.trim() === "running" ? "running" : "stopped";
    return {
      state,
      pid: pidMatch ? Number(pidMatch[1]) : null,
    };
  } catch {
    return { state: "not loaded", pid: null };
  }
}

function readPlistString(xml: string, key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<key>${escapedKey}</key>\\s*<string>([^<]+)</string>`));
  return match?.[1]?.trim() || "";
}

function isGatewayRunning(profileDir: string) {
  try {
    const pidPath = path.join(profileDir, "gateway.pid");
    if (!fs.existsSync(pidPath)) return false;
    const raw = fs.readFileSync(pidPath, "utf-8").trim();
    if (!raw) return false;
    const parsed = raw.startsWith("{") ? JSON.parse(raw) : { pid: Number(raw) };
    process.kill(Number(parsed.pid), 0);
    return true;
  } catch {
    return false;
  }
}

function countProfileSkills(profileDir: string) {
  const skillsDir = path.join(profileDir, "skills");
  let count = 0;

  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && entry.name === "SKILL.md") {
        count += 1;
      }
    }
  };

  try {
    if (fs.existsSync(skillsDir)) {
      visit(skillsDir);
    }
  } catch {
    return count;
  }

  return count;
}
