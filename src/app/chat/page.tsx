"use client";

import { useState, useRef, useEffect } from "react";
import PageHero from "@/components/PageHero";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

const CLOUD_MODELS = [
  { id: "gpt-5.4", label: "GPT-5.4", provider: "openai-codex" },
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", provider: "openrouter" },
  { id: "anthropic/claude-haiku-4", label: "Claude Haiku 4", provider: "openrouter" },
  { id: "google/gemini-2.5-flash-preview", label: "Gemini 2.5 Flash", provider: "openrouter" },
  { id: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro", provider: "openrouter" },
  { id: "deepseek/deepseek-chat-v3", label: "DeepSeek V3", provider: "openrouter" },
];

interface ModelOption {
  id: string;
  label: string;
  provider: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content: "Connected to Herminator. Type a message to begin.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gpt-5.4");
  const [ollamaModels, setOllamaModels] = useState<ModelOption[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/chat?action=models")
      .then((r) => r.json())
      .then((data) => {
        if (data.ollama) {
          setOllamaModels(data.ollama.map((name: string) => ({
            id: `ollama:${name}`,
            label: name,
            provider: "ollama",
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, model }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || data.error || "No response received.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        content: `Error: ${err instanceof Error ? err.message : "Failed to send message"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "system",
      content: "Chat cleared. Type a message to begin.",
      timestamp: new Date(),
    }]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-5">
      <PageHero
        eyebrow="Chat"
        title="Talk to Herminator"
        description="Realtime chat across the Hermes gateway and fallback models."
        actions={
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="appearance-none rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(11,4,21,0.7)] px-3 py-2 text-xs text-[#f3cfec] outline-none transition-colors focus:border-[#39e6ff]/40 pr-7"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234a5568' fill='none' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              <optgroup label="Cloud">
                {CLOUD_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </optgroup>
              {ollamaModels.length > 0 && (
                <optgroup label="Local (Ollama)">
                  {ollamaModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              onClick={clearChat}
              className="btn-neon flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        }
        stats={
          <>
            <span className="rounded-full border border-[rgba(57,230,255,0.15)] bg-[rgba(57,230,255,0.06)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8ceeff]">
              {messages.length - 1} turns
            </span>
            <span className="rounded-full border border-[rgba(255,79,216,0.18)] bg-[rgba(255,79,216,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#ffd0ef]">
              {model}
            </span>
          </>
        }
      />

      {/* Messages area */}
      <div className="min-h-[360px] flex-1 space-y-4 overflow-y-auto rounded-[28px] glass-card p-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "msg-user"
                  : msg.role === "system"
                  ? "msg-system"
                  : "msg-assistant"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[rgba(255,79,216,0.2)] to-[rgba(57,230,255,0.08)]">
                    <svg className="h-3 w-3 text-[#7cefff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7cefff]">Herminator</span>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed text-[#f6d5ef]">
                {msg.content}
              </div>
              <div className={`text-[10px] mt-2 ${
                msg.role === "user" ? "text-[#8beeff]/50" : "text-[#cfa9df]"
              }`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="msg-assistant rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[rgba(255,79,216,0.2)] to-[rgba(57,230,255,0.08)]">
                  <svg className="h-3 w-3 text-[#7cefff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7cefff]">Herminator</span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <div className="w-2 h-2 bg-[#00d4ff] rounded-full typing-dot-1" />
                <div className="w-2 h-2 bg-[#00d4ff] rounded-full typing-dot-2" />
                <div className="w-2 h-2 bg-[#00d4ff] rounded-full typing-dot-3" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex items-end gap-3 rounded-[28px] glass-card-strong p-4">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Herminator..."
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent text-sm leading-relaxed text-white outline-none placeholder-[#8d73a8]"
          style={{
            height: "auto",
            minHeight: "24px",
            overflow: input.split("\n").length > 4 ? "auto" : "hidden",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 128) + "px";
          }}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="btn-neon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        >
          <svg className="h-4 w-4 text-[#7cefff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
