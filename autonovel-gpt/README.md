# autonovel-gpt

A ChatGPT-powered adaptation of [NousResearch/autonovel](https://github.com/NousResearch/autonovel) — an autonomous pipeline for writing complete novel manuscripts.

This fork replaces the Anthropic/Claude backend with OpenAI's API (gpt-4o + o1), supports **OAuth bearer token authentication** for use with the Herminator Dashboard, and re-engineers every system prompt for GPT-4o's strengths.

---

## Architecture

```
autonovel-gpt/
├── llm_client.py         # Shared OpenAI client (OAuth + API key support)
├── gen_world.py          # Phase 1: Generate world.md from seed
├── gen_characters.py     # Phase 1: Generate characters.md
├── draft_chapter.py      # Phase 2: Write chapters (gpt-4o, temp 0.85)
├── evaluate.py           # Phase 2/3: Score foundation, chapters, full novel
├── adversarial_edit.py   # Phase 3: Find ~500 words to cut per chapter
├── review.py             # Phase 3: Dual-expert deep review (see below)
├── .env.example          # Configuration template
└── requirements.txt
```

---

## The Two Expert Agents (review.py)

This is the core innovation of the review phase.  Two fully-committed AI personas analyse the manuscript independently and in sequence:

### Agent 1 — Margaret Holloway (Literary Critic)
- Persona: 25-year newspaper critic (The Atlantic, NYRB, The Guardian)
- Task: Writes a 600–900 word book review with a **star rating (1–5, ½-star increments)**
- Model: `o1` for full manuscripts (superior long-range coherence tracking); `gpt-4o` for chapters
- Temperature: 0.5 (some creative latitude for vivid critical prose)
- Output includes: rating, opening strength, prose quality, pacing, world-building, character depth, emotional resonance

### Agent 2 — Dr. James Whitfield (Professor of Fiction)
- Persona: MFA director + developmental editor (30 years, 60+ published novels)
- Task: Produces **8–15 numbered craft notes** with SEVERITY (MAJOR/MODERATE/MINOR) and FIX-TYPE (STRUCTURAL/CHARACTER/PACING/PROSE/COMPRESSION/ADDITION/CONTINUITY)
- Model: `o1` for full manuscripts; `gpt-4o` for chapters
- Temperature: 0.1 (maximum precision and reproducibility)
- Output includes: per-item location, detail, fix prescription, and a structured summary

### Stopping logic
Revision terminates when any of these conditions are met:
- Rating ≥ 4.5 with zero MAJOR items
- Rating ≥ 4.0 with >50% of items qualified/hedged
- ≤ 2 total items remaining (noise floor)

---

## Model Mapping (Claude → GPT-4o)

| Original (Claude)          | This fork (OpenAI)          | Rationale                                      |
|----------------------------|-----------------------------|------------------------------------------------|
| claude-sonnet-4-6           | gpt-4o (temp 0.85)          | Creative writing, world-building               |
| claude-opus-4-6 (reviewer) | o1                          | Long-form reasoning, manuscript coherence      |
| claude-opus-4-6 (judge)    | gpt-4o (temp 0.1–0.2)       | Evaluation, JSON extraction                    |
| Anthropic beta (1M ctx)    | o1 (200k) + chunking helper | Context limit handling                         |

---

## Authentication

### OAuth (Herminator Dashboard — recommended)

After completing the OpenAI OAuth PKCE flow in the dashboard, set the returned bearer token:

```bash
OPENAI_OAUTH_TOKEN=<token from dashboard>
```

The token is accepted by the OpenAI API in the same `Authorization: Bearer` header as an API key.

### API Key (local / CI)

```bash
OPENAI_API_KEY=sk-...
```

Both are configured in `.env` (copy `.env.example` to `.env`).

---

## Quickstart

```bash
cd autonovel-gpt
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your OPENAI_OAUTH_TOKEN or OPENAI_API_KEY

# Phase 1 — Foundation
echo "A city built inside a fossilised god" > seed.txt
python gen_world.py > world.md
python gen_characters.py > characters.md

# Phase 2 — Draft
python draft_chapter.py --chapter 1
python evaluate.py --mode chapter --chapter 1

# Phase 3 — Revise
python adversarial_edit.py --chapter 1
python review.py --output review.md    # runs both expert agents
python review.py --parse               # parse latest saved review

# Full pipeline
python draft_chapter.py --all
python review.py --output final_review.md
```

---

## Key Prompt Engineering Decisions

1. **Committed personas** — GPT-4o honours named professional identities more reliably than abstract role descriptions.  "Margaret Holloway, senior critic at The Atlantic" outperforms "act as a book critic".

2. **Calibrated scoring anchors** — Every evaluator prompt includes explicit number-to-meaning mappings (e.g., "6/10 = competent AI output, not good fiction") to prevent GPT-4o's default tendency toward inflation.

3. **Anti-pattern lists in system prompts** — GPT-4o avoids banned patterns reliably when they are named up-front in the system prompt rather than after-the-fact in the user turn.

4. **Separated temperature by task** — Writer: 0.85 | World-builder: 0.75 | Critic: 0.5 | Judge: 0.2 | Editor: 0.3.

5. **o1 for deep review** — o1's extended reasoning chain tracks long-range narrative coherence better than gpt-4o for full-manuscript analysis.

6. **JSON schemas demonstrated, not described** — Every JSON-output prompt includes a complete example schema.  GPT-4o follows demonstrated formats more reliably than described ones.

---

## Context Window Notes

- gpt-4o: 128k tokens (~91k words usable with response headroom)
- o1: 200k tokens (~143k words usable)
- Manuscripts exceeding these limits are automatically summarised by `llm_client.summarise_manuscript()` before being passed to review agents.
