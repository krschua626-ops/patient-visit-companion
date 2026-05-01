# Patient Visit Companion

A clickable demo of a grounded, patient-facing AI assistant for clinical trial visits. Includes a simulated **Uber Health** booking flow for sponsor-paid round-trip transportation. Designed to make the concept tangible to product leadership and design partners — not a production system.

---

## What this is

A two-surface demo:

- **Patient app** (mobile-shaped): home screen with the next-visit card, sponsor-paid **Uber Health** ride booking with live status (outbound morning-of, return post-visit), full visit briefing with an interactive prep checklist, and a grounded chat with a floating action button.
- **Demo console** (`/demo`): persona switcher, time-offset switcher, and one-click scripted scenarios for live demos. An audit log at `/demo/audit-log` shows every chat turn with retrieved context, grounding sources, confidence, escalation flag, and latency.

Every chat turn is grounded in three structured artifacts:

1. **Procedure library** (`server/data/procedureLibrary.json`) — 12 reusable, plain-language procedure templates with prep, post-care, items to bring, and common Q&A.
2. **Study definition** (`server/data/study.json`) — fictional Phase 2 oncology study (HORIZON-2) with 6 visits and a study-level FAQ.
3. **Patient profiles** (`server/data/patients.json`) — three personas (Maria, James, Wei) including conmeds, history flags, language preference, and personality notes.

A `ContextAssembler` rolls these up into a single patient-visit context object that drives both the UI and the chat system prompt.

## What this is *not*

- Not a production product. No PHI, no HIPAA claims, no real protocol ingestion.
- No authentication. No database — state is in-memory only and resets on server restart.
- Not a clinical decision-support tool. The assistant refuses medical advice and escalates symptom questions to the study coordinator.
- No real medical content. All study and procedure copy is fictional.

## Running it

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. The Express API runs at `http://localhost:3001` and is auto-proxied. `npm run dev` starts both with one command.

**Required env vars:**
- `ANTHROPIC_API_KEY` — from your Anthropic console
- `CLAUDE_MODEL` (optional) — defaults to `claude-sonnet-4-5`

## Scripted demo scenarios

Open `/demo` and click any card to set persona + timing and auto-send the prompt to chat:

| Scenario | Persona | Timing | Prompt | Expected behavior |
|---|---|---|---|---|
| Anxious first-timer | Maria | 3 days before V3 | *"I'm nervous about tomorrow…"* | Grounded, reassuring walkthrough of V3 procedures |
| Fasting confusion | James | Morning of V3 | *"Can I have my coffee?"* | Says no, cites 8-hour fast for PK draw |
| Med question (escalation) | James | Morning of V3 | *"Should I take my Lipitor?"* | Refuses to advise, surfaces coordinator handoff |
| Symptom (hard escalation) | Maria | Day before V3 | *"I've been having chest tightness…"* | Hard escalation: 911 / after-hours line |
| Multilingual | Wei | Day before V3 | (Mandarin) *"What should I bring?"* | Mandarin response with grounding sources |
| Out of scope | Maria | 3 days before V3 | *"What do you think about this drug?"* | Refuses opinion, points back to study team |
| First-time ride booking | Maria | Day before V3 | *"How does the Uber ride work?"* | Explains sponsor-paid Uber Health flow |
| Day-of ride status | James | Morning of V3 | *"Where is my driver right now?"* | Live status, driver, vehicle, plate, ETA |

Each scenario opens an audit log entry in `/demo/audit-log` for inspection.

## Architecture

```
patient-visit-companion/
├── server/                      # Express API (port 3001)
│   ├── index.ts                 # mount routes, health check
│   ├── contextAssembler.ts      # patient-visit context rollup
│   ├── systemPrompt.ts          # grounded LLM system prompt builder
│   ├── auditLog.ts              # in-memory ring buffer (max 100 entries)
│   ├── routes/
│   │   ├── context.ts           # GET /api/patient-context, /patients, /study
│   │   ├── chat.ts              # POST /api/chat (Anthropic SDK)
│   │   └── audit.ts             # GET /api/audit-log, POST /api/reset
│   └── data/                    # procedureLibrary, study, patients (JSON)
│
└── src/                         # Vite + React frontend
    ├── components/
    │   ├── ui/                  # Button, Card, Badge, Input
    │   ├── layout/              # PhoneFrame, BottomNav, ChatFab, PageHeader
    │   ├── ChatBubble.tsx       # message + grounding sources + escalation
    │   ├── EscalationCard.tsx   # warm coordinator-handoff CTA
    │   └── SourcePill.tsx       # grounding-source chip
    ├── pages/                   # Home, Visit, Chat, Demo, AuditLog
    ├── lib/                     # api client, hooks, scenarios, types
    └── state/sessionStore.ts    # useSyncExternalStore-backed session
```

## Design notes

- **Grounded by construction.** Every chat turn injects the assembled patient-visit context into the system prompt. The LLM is told to refuse anything outside this grounding.
- **Two escalation modes.** Soft (refusal + coordinator handoff card with pre-written summary) and hard (symptom triage with after-hours line + 911 guidance).
- **Visible trust.** Every assistant reply surfaces grounding source pills, and the audit log captures the same data for review.
- **Light Notion-inspired aesthetic.** Warm stone neutrals, a single calm-blue primary, semantic status colors. No dark mode.
- **One LLM call per turn.** No multi-step prompt chains; the grounding lives entirely in the system prompt.

## Future roadmap (not built here)

- **Proactive nudges** — the assistant initiates rather than only responding (fasting reminders, prep deadlines, post-visit check-ins).
- **Coordinator surface** — companion view for site staff: incoming patient questions, suggested replies grounded in protocol, one-click acknowledge.
- **Amendment propagation** — when a protocol amendment changes a procedure (e.g., new fasting window), the change flows to the patient briefing and chat grounding without manual sync.
- **Real protocol ingestion** — USDM-formatted study definitions feed the procedure library and visit schedule directly.
- **Real Uber Health integration** — the current ride flow is simulated. Production would call the Uber Health Ride Request API with sponsor credentials, persist ride records, and surface real driver telemetry. The data shapes here (`Ride`, `RideStatus`, leg routing) match what that API expects.
- **Multi-modal** — voice input/output for low-literacy or accessibility cases; image upload (e.g., medication bottle) for the conmed review.
- **Study-team-defined refusal rules** — site- or sponsor-level overrides on what the assistant can answer vs. escalate.
