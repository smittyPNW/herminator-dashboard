"use client";

import { useState, useEffect, useCallback } from "react";
import PageHero from "@/components/PageHero";
import SkillHubPanel from "@/components/SkillHubPanel";

interface SkillInfo {
  name: string;
  category: string;
  hasSkillMd: boolean;
  path: string;
}

interface SkillCategory {
  name: string;
  skills: SkillInfo[];
}

export default function SkillsPage() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<{ category: string; skill: string } | null>(null);
  const [skillContent, setSkillContent] = useState<string | null>(null);
  const [skillLoading, setSkillLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data: SkillCategory[]) => {
        setCategories(data);
        setExpandedCategories(new Set(data.map((c) => c.name)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadSkill = useCallback(async (category: string, skill: string) => {
    setSelectedSkill({ category, skill });
    setSkillLoading(true);
    setSkillContent(null);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(category)}/${encodeURIComponent(skill)}`);
      const data = await res.json();
      setSkillContent(data.content || data.error || "No content available.");
    } catch {
      setSkillContent("Failed to load skill content.");
    } finally {
      setSkillLoading(false);
    }
  }, []);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalSkills = categories.reduce((acc, cat) => acc + cat.skills.length, 0);

  const filteredCategories = searchQuery
    ? categories
        .map((cat) => ({
          ...cat,
          skills: cat.skills.filter(
            (s) =>
              s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.category.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.skills.length > 0)
    : categories;

  const filteredTotal = filteredCategories.reduce((acc, cat) => acc + cat.skills.length, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="Skills"
          title="Hermes skill library"
          description="Loading installed skills and registry search."
        />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="Skills"
        title="Hermes skill library"
        description="Search the registry, audit installed skills, and open local documentation without leaving the operator console."
        stats={
          <>
            <span className="rounded-full border border-[rgba(57,230,255,0.15)] bg-[rgba(57,230,255,0.06)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8ceeff]">
              {totalSkills} installed skills
            </span>
            <span className="rounded-full border border-[rgba(255,79,216,0.18)] bg-[rgba(255,79,216,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#ffd0ef]">
              {categories.length} categories
            </span>
          </>
        }
      />

      <div className="synth-panel p-5">
        <div className="mb-4">
          <div className="card-title">Search And Install</div>
          <p className="mt-2 text-sm text-[#f6c8ea]">
            Search Hermes skill registries and install new skills without leaving the dashboard.
          </p>
        </div>
        <SkillHubPanel />
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d73a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter skills by name..."
          className="w-full rounded-xl glass-card py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#8d73a8] transition-all focus:border-[#00d4ff]/30 focus:outline-none focus:ring-1 focus:ring-[#00d4ff]/20"
        />
        {searchQuery && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#d6afd7]">
            {filteredTotal} results
          </span>
        )}
      </div>

      {/* Two-panel layout */}
      <div className="flex min-h-[calc(100vh-14rem)] flex-col gap-4 xl:flex-row">
        {/* Left panel */}
        <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl glass-card xl:w-72">
          <div className="border-b border-[rgba(255,79,216,0.16)] px-4 py-3">
            <h2 className="card-title">Categories</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredCategories.map((cat) => (
              <div key={cat.name} className="mb-0.5">
                <button
                  onClick={() => toggleCategory(cat.name)}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`h-3 w-3 text-[#8d73a8] transition-transform duration-200 ${expandedCategories.has(cat.name) ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-[#f0c8ea] transition-colors group-hover:text-white">{cat.name}</span>
                  </div>
                  <span className="rounded-full bg-[rgba(57,230,255,0.08)] px-2 py-0.5 font-mono text-[10px] text-[#8beeff]">{cat.skills.length}</span>
                </button>
                {expandedCategories.has(cat.name) && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {cat.skills.map((skill) => {
                      const isSelected = selectedSkill?.category === skill.category && selectedSkill?.skill === skill.name;
                      return (
                        <button
                          key={`${skill.category}-${skill.name}`}
                          onClick={() => skill.hasSkillMd && loadSkill(skill.category, skill.name)}
                          disabled={!skill.hasSkillMd}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all relative ${
                            isSelected
                              ? "text-[#8beeff] bg-[rgba(57,230,255,0.08)]"
                              : skill.hasSkillMd
                              ? "text-[#d9b4de] hover:text-white hover:bg-[rgba(255,255,255,0.04)] cursor-pointer"
                              : "text-[#8d73a8] cursor-default"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute left-0 top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-r-full bg-[#39e6ff] shadow-[0_0_8px_rgba(57,230,255,0.55)]" />
                          )}
                          <span className="flex items-center gap-2">
                            {skill.hasSkillMd && (
                              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {skill.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl glass-card">
          {selectedSkill && skillContent ? (
            <>
              <div className="flex items-center justify-between border-b border-[rgba(255,79,216,0.16)] px-5 py-3.5">
                <div>
                  <h2 className="text-sm font-semibold text-white">{selectedSkill.skill}</h2>
                  <p className="mt-0.5 font-mono text-[10px] text-[#d6afd7]">{selectedSkill.category}</p>
                </div>
                <button
                  onClick={() => { setSelectedSkill(null); setSkillContent(null); }}
                  className="text-[10px] font-medium uppercase tracking-wider text-[#d6afd7] transition-colors hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {skillLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="prose-hermes">
                    <SkillMarkdown content={skillContent} />
                  </div>
                )}
              </div>
            </>
          ) : skillLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
            </div>
          ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(57,230,255,0.06)]">
                  <svg className="h-10 w-10 text-[#8beeff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Skill Browser</h3>
                <p className="max-w-xs text-sm leading-relaxed text-[#d6afd7]">
                  {totalSkills} skills across {categories.length} categories. Select a skill from the left panel to view its documentation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
      } else {
        html.push("<pre><code>");
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line) + "\n");
      continue;
    }

    if (line.startsWith("# ")) {
      html.push(`<h1>${processInline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2>${processInline(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      html.push(`<h3>${processInline(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      html.push(`<li>${processInline(line.slice(2))}</li>`);
    } else if (line.startsWith("> ")) {
      html.push(`<blockquote><p>${processInline(line.slice(2))}</p></blockquote>`);
    } else if (line.trim() === "") {
      html.push("<br/>");
    } else {
      html.push(`<p>${processInline(line)}</p>`);
    }
  }

  if (inCodeBlock) {
    html.push("</code></pre>");
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: html.join("\n") }} />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function processInline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
