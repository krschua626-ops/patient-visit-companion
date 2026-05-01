# Demo notes (presenter-facing)

Notes for running this demo live. Keep this file open in a separate tab.

## Before the demo

- Confirm `.env` has a valid `ANTHROPIC_API_KEY`. Without one, the chat returns a clear error message but no real LLM responses.
- Run `npm run dev` and visit `http://localhost:5173`. Both Vite (5173) and Express (3001) start together.
- Hit the **Reset** button in `/demo` once before going live to clear the audit log.

## Suggested narrative arc (≈ 6 minutes)

1. **Open `/` as Maria, 3 days before V3.** Show the home: time-aware greeting, "Your next visit" card, sponsor-paid Uber Health booking card, "to do" prep status. Talk about how the briefing card, prep checklist, and ride suggestion are all computed from the structured procedure library and patient profile — *not* hand-authored per study.
2. **Tap "Tap to book with Uber Health"** → bottom sheet with home address pre-filled, drop-off = study site, suggested 8:45 AM pickup, sponsor-paid framing. Book it. Watch the card flip to "Confirmed" with confirmation code.
3. **Tap the visit card** → V3 detail. Walk through "What's happening" (9 procedures, plain language), tap a checklist item.
4. **Tap the chat FAB** → suggested prompts. Send "What should I bring?" — show the grounding source pills under the reply.
5. **Switch to `/demo`** → click **"Day-of ride status"**. Switches to James + morning of V3. The chat answers "Where is my driver right now?" with the live driver name, plate, and ETA from the ride state. Show the grounding pill: *"Transportation: outbound ride."*
6. **Click "Med question (escalation)"** — James, morning of V3, asks about Lipitor. The chat refuses, surfaces the coordinator handoff card.
7. **Click "Symptom (hard escalation)"** — chest tightness. The assistant doesn't try to triage; it tells the patient to call 911 or the after-hours line.
8. **Click "Multilingual"** — Wei asks in Mandarin, gets a Mandarin reply with English source labels.
9. **End in `/demo/audit-log`.** Every turn from the demo is here: retrieved context summary, grounding sources, confidence, escalation flag, latency. This is the auditability story.

## Things to call out

- **The procedure library is reusable.** A blood draw is the same blood draw across studies. Translation happens once, then maps via codes.
- **The system prompt is one well-grounded shot, not a prompt chain.** Easier to audit, faster, more legible. Look at `server/systemPrompt.ts`.
- **In-memory only.** Clean for a demo; obviously not production. Persistence is a phase 2 concern.
- **No login / no PHI.** This is a flow demo; the data layer that would handle PHI is intentionally not built.

## Things that are intentionally rough

- **No streaming.** Replies appear all at once after the API call. Easier to demo, less moving paint.
- **Time offset is a switch, not a clock.** Production would derive timing from real visit datetimes.
- **One study, one site, three patients.** Enough to tell the story. The data shapes are the right ones for scaling.
- **Outstanding tasks (`outstanding_tasks`) are faked per time-offset.** In production they'd come from the eCOA system + scheduling integration.
- **Audit log is in-memory and capped at 100 entries.** Reset between demos so it's clean.
- **Uber Health rides are simulated.** Bookings, drivers, ETAs, and status progression are fake but realistic. The state machine and data shapes match the real Uber Health API; production would swap in real API calls. Auto-progression on `morning_of` (outbound) and `post_visit` (return) takes ~90 seconds end-to-end so you can demo it live.

## If something goes wrong on stage

- **"ANTHROPIC_API_KEY is not set"** — check `.env`, restart `npm run dev`.
- **Mandarin scenario returns English** — confirm Wei is selected, refresh chat, retry. The system prompt switches to Mandarin only when `patient.language === 'zh'`.
- **Chat hangs** — model call timeout or Anthropic API hiccup. Hit the input, retype, send again. The audit log will tell you whether the call ever made it back.
- **Audit log seems empty after a chat turn** — auto-refreshes every 5s, or hit the Refresh button. If still empty, the call probably failed before audit logging — check the browser console for the `/api/chat` error.

## Key code paths (if asked)

- **System prompt** — `server/systemPrompt.ts`. ~16K characters of structured grounding per turn. Walk through the sections live.
- **Context assembler** — `server/contextAssembler.ts`. Note the dedupe of pre/post requirements across procedures.
- **Escalation rules** — see the "WHAT YOU MUST NOT DO" and "HARD ESCALATION" sections inside the system prompt.
- **Audit logging** — `server/routes/chat.ts` calls `logAuditEntry` on every turn, before sending the response back.
