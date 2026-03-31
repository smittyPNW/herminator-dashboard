import fs from "fs";
import path from "path";
import { execFileSync, execSync } from "child_process";
import YAML from "yaml";

export const HERMES_DIR = process.env.HERMES_DIR || `${process.env.HOME}/.hermes`;
const HERMES_AGENT_DIR = path.join(HERMES_DIR, "hermes-agent");

function getPythonPath() {
  return path.join(HERMES_AGENT_DIR, "venv/bin/python");
}

function getDefaultExecOptions(timeout = 15000) {
  return {
    encoding: "utf-8" as const,
    timeout,
    cwd: HERMES_AGENT_DIR,
    env: { ...process.env, HOME: process.env.HOME, HERMES_HOME: HERMES_DIR },
  };
}

function runHermesPython(script: string, timeout = 30000) {
  return execFileSync(getPythonPath(), ["-"], {
    ...getDefaultExecOptions(timeout),
    input: script,
  });
}

export interface GatewayState {
  pid: number;
  kind: string;
  gateway_state: string;
  start_time: string | null;
  exit_reason: string | null;
  platforms: Record<string, { state: string; updated_at: string }>;
  updated_at: string;
}

export function readGatewayState(): GatewayState | null {
  try {
    const data = fs.readFileSync(path.join(HERMES_DIR, "gateway_state.json"), "utf-8");
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
}

export function listCronJobs(): CronJob[] {
  try {
    const output = execSync(`${shellQuote(getPythonPath())} -m hermes_cli.main cron list 2>/dev/null`, getDefaultExecOptions());
    return parseCronOutput(output);
  } catch {
    return [];
  }
}

function parseCronOutput(output: string): CronJob[] {
  const jobs: CronJob[] = [];
  let current: Partial<CronJob> = {};

  for (const line of output.split("\n")) {
    const trimmed = line.trim();

    const idMatch = trimmed.match(/^([a-f0-9]{8})\s+\[(active|paused|completed)\]/);
    if (idMatch) {
      if (current.id) {
        jobs.push(current as CronJob);
      }
      current = {
        id: idMatch[1],
        status: idMatch[2],
        skills: [],
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
}

export function listSessions(): SessionFile[] {
  const sessionsDir = path.join(HERMES_DIR, "sessions");
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
      });
    }
    return sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch {
    return [];
  }
}

export interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
  tool_calls?: unknown[];
}

export function readSession(filename: string): SessionMessage[] {
  const sessionsDir = path.join(HERMES_DIR, "sessions");
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
}

export function listLogs(): LogEntry[] {
  const logsDir = path.join(HERMES_DIR, "logs");
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
      logs.push({ name: file, size: stat.size, modified: stat.mtime, tail });
    }
    return logs.sort((a, b) => b.modified.getTime() - a.modified.getTime());
  } catch {
    return [];
  }
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

export function cronAction(action: "pause" | "resume" | "run" | "remove", jobId: string): { success: boolean; message: string } {
  try {
    const command = `${shellQuote(getPythonPath())} -m hermes_cli.main cron ${shellQuote(action)} ${shellQuote(jobId)}`;
    execSync(command, getDefaultExecOptions(20000));
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
