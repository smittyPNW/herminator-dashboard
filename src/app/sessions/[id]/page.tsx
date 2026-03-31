"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
}

interface SessionData {
  name: string;
  date: string;
  size: number;
  isCron: boolean;
  messages: SessionMessage[];
  messageCount: number;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sessionId = params.id as string;

  useEffect(() => {
    fetch(`/api/sessions/${encodeURIComponent(sessionId)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Session not found");
        return r.json();
      })
      .then((d) => { setSession(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#4a5568] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white glow-text">Session</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#4a5568] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Session</h1>
        </div>
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-red-400">{error || "Session not found"}</p>
          <button onClick={() => router.push("/sessions")} className="btn-neon px-4 py-2 rounded-lg text-sm mt-4">
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const filteredMessages = searchQuery
    ? session.messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : session.messages;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#4a5568] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white glow-text">Session Viewer</h1>
            <p className="text-[10px] text-[#2a3f58] font-mono mt-0.5">{decodeURIComponent(sessionId)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session.isCron && (
            <span className="text-[10px] bg-[rgba(251,191,36,0.08)] text-[#fbbf24] border border-[rgba(251,191,36,0.15)] px-2 py-1 rounded-lg font-medium">CRON</span>
          )}
          <span className="text-[10px] text-[#4a5568] font-mono">{session.messageCount} messages</span>
          <span className="text-[10px] text-[#2a3f58] font-mono">{formatSize(session.size)}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2a3f58]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white placeholder-[#2a3f58] focus:outline-none focus:border-[#00d4ff]/30 focus:ring-1 focus:ring-[#00d4ff]/20 text-sm transition-all"
        />
      </div>

      {/* Messages */}
      <div className="glass-card rounded-2xl p-5 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <p className="text-center text-[#2a3f58] py-8">
            {searchQuery ? "No matching messages" : "No messages in this session"}
          </p>
        ) : (
          filteredMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user" ? "msg-user" : msg.role === "system" ? "msg-system" : "msg-assistant"
              }`}>
                {msg.role !== "user" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(0,212,255,0.05)]"
                        : "bg-[#1e2d40]"
                    }`}>
                      {msg.role === "assistant" ? (
                        <svg className="w-3 h-3 text-[#00d4ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-[#4a5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      msg.role === "assistant" ? "text-[#00d4ff]" : "text-[#4a5568]"
                    }`}>
                      {msg.role}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-[#2a3f58] font-mono ml-auto">{msg.timestamp}</span>
                    )}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed text-[#a0aec0]">
                  {msg.content.length > 2000 ? msg.content.substring(0, 2000) + "\n\n... (truncated)" : msg.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
