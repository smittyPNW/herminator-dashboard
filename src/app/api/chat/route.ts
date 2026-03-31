import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const HERMES_DIR = process.env.HERMES_DIR || `${process.env.HOME}/.hermes`;
const GATEWAY_PORT = 8642;

function loadOpenRouterKey(): string {
  try {
    const envFile = fs.readFileSync(path.join(HERMES_DIR, ".env"), "utf-8");
    const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  } catch {
    // .env may not exist
  }
  return "";
}

async function chatViaGateway(
  message: string,
  history: { role: string; content: string }[]
): Promise<string | null> {
  const messages = [
    {
      role: "system",
      content:
        "You are Herminator, a helpful AI assistant running inside Hermes. You help with system management, coding, and general questions. Be concise and helpful.",
    },
    ...history,
    { role: "user", content: message },
  ];

  try {
    const res = await fetch(`http://localhost:${GATEWAY_PORT}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "hermes-agent",
        messages,
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (res.ok) {
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return reply;
    }
  } catch {
    // Gateway not available
  }
  return null;
}

async function chatViaOpenRouter(
  message: string,
  history: { role: string; content: string }[],
  model: string = "anthropic/claude-sonnet-4",
  appOrigin?: string
): Promise<string> {
  const apiKey = loadOpenRouterKey();
  if (!apiKey) {
    throw new Error("No OpenRouter API key found");
  }

  const messages = [
    {
      role: "system",
      content:
        "You are Herminator, a helpful AI assistant running inside Hermes. You help with system management, coding, and general questions. Be concise and helpful.",
    },
    ...history,
    { role: "user", content: message },
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": appOrigin || process.env.APP_ORIGIN || "http://localhost:3000",
      "X-Title": "Herminator Dashboard",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("No response content from OpenRouter");
  }
  return reply;
}

async function chatViaOllama(
  message: string,
  history: { role: string; content: string }[],
  model: string
): Promise<string> {
  const messages = [
    {
      role: "system",
      content:
        "You are Herminator, a helpful AI assistant running inside Hermes. You help with system management, coding, and general questions. Be concise and helpful.",
    },
    ...history,
    { role: "user", content: message },
  ];

  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    throw new Error(`Ollama error (${res.status})`);
  }

  const data = await res.json();
  return data.message?.content || "No response from Ollama";
}

async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || [])
      .map((m: { name: string }) => m.name)
      .filter((name: string) => !name.includes("embed"));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  if (action === "models") {
    const ollama = await listOllamaModels();
    return NextResponse.json({ ollama });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], model = "gpt-5.4" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Route based on model selection
    if (typeof model === "string" && model.startsWith("ollama:")) {
      const ollamaModel = model.replace("ollama:", "");
      try {
        const reply = await chatViaOllama(message, history, ollamaModel);
        return NextResponse.json({ reply });
      } catch (err) {
        console.error("[chat] Ollama error:", err);
        return NextResponse.json({ error: "Ollama is not available" }, { status: 503 });
      }
    }

    // For gpt-5.4 (default), try the Hermes gateway first
    if (model === "gpt-5.4") {
      const gatewayReply = await chatViaGateway(message, history);
      if (gatewayReply) {
        return NextResponse.json({ reply: gatewayReply });
      }
    }

    // OpenRouter models
    try {
      const orModel = model === "gpt-5.4" ? "anthropic/claude-sonnet-4" : model;
      const reply = await chatViaOpenRouter(message, history, orModel, req.nextUrl.origin);
      return NextResponse.json({ reply });
    } catch (orError) {
      console.error("[chat] OpenRouter fallback failed:", orError);
    }

    return NextResponse.json(
      {
        error:
          "Chat is currently unavailable. The Hermes gateway API server is not running and the OpenRouter fallback failed. Please check your configuration.",
      },
      { status: 503 }
    );
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: `Chat error: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
