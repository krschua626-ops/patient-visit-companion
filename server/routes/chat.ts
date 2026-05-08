import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { assembleContext, getStudy } from '../contextAssembler.js'
import { buildSystemPrompt, summarizeContext, summarizePrompt } from '../systemPrompt.js'
import { logAuditEntry } from '../auditLog.js'
import type { ChatResponse, ChatTurn, TimeOffset } from '../types.js'

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const chatRouter = Router()

chatRouter.post('/chat', async (req, res) => {
  const start = Date.now()
  const { patientId, visitId, timeOffset, message, history } = req.body as {
    patientId: string
    visitId: string
    timeOffset: TimeOffset
    message: string
    history?: ChatTurn[]
  }

  if (!patientId || !visitId || !timeOffset || !message) {
    return res.status(400).json({ error: 'patientId, visitId, timeOffset, and message are required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.',
    })
  }

  const ctx = assembleContext(patientId, visitId, timeOffset)
  if (!ctx) return res.status(404).json({ error: 'Patient or visit not found' })

  const study = getStudy()
  const systemPrompt = buildSystemPrompt(ctx, study)

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  if (history && Array.isArray(history)) {
    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content })
    }
  }
  messages.push({ role: 'user', content: message })

  let parsed: ChatResponse
  let rawText = ''
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
    rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    parsed = parseChatJson(rawText)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('Chat error:', errorMsg)
    return res.status(500).json({ error: `Model call failed: ${errorMsg}` })
  }

  const latency = Date.now() - start

  logAuditEntry({
    patient_id: patientId,
    visit_id: visitId,
    time_offset: timeOffset,
    user_message: message,
    retrieved_context_summary: summarizeContext(ctx),
    system_prompt_summary: summarizePrompt(systemPrompt),
    reply: parsed.reply,
    confidence: parsed.confidence,
    escalation_recommended: parsed.escalation_recommended,
    grounding_sources: parsed.grounding_sources,
    latency_ms: latency,
  })

  res.json(parsed)
})

function parseChatJson(text: string): ChatResponse {
  const trimmed = text.trim()
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let candidate = stripped
  if (!candidate.startsWith('{')) {
    const m = candidate.match(/\{[\s\S]*\}/)
    if (m) candidate = m[0]
  }

  const parsed = JSON.parse(candidate) as Partial<ChatResponse>
  const actions = Array.isArray(parsed.suggested_actions)
    ? parsed.suggested_actions.filter(
        (a): a is { label: string; kind: 'prompt' | 'link' | 'tel'; value: string } =>
          a !== null &&
          typeof a === 'object' &&
          typeof (a as { label?: unknown }).label === 'string' &&
          typeof (a as { value?: unknown }).value === 'string' &&
          ((a as { kind?: unknown }).kind === 'prompt' ||
            (a as { kind?: unknown }).kind === 'link' ||
            (a as { kind?: unknown }).kind === 'tel'),
      )
    : []
  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights.filter((s): s is string => typeof s === 'string').slice(0, 3)
    : []
  return {
    reply: typeof parsed.reply === 'string' ? parsed.reply : '',
    confidence:
      parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low'
        ? parsed.confidence
        : 'low',
    escalation_recommended: Boolean(parsed.escalation_recommended),
    escalation_summary: typeof parsed.escalation_summary === 'string' ? parsed.escalation_summary : undefined,
    grounding_sources: Array.isArray(parsed.grounding_sources)
      ? parsed.grounding_sources.filter((s): s is string => typeof s === 'string')
      : [],
    suggested_actions: actions.slice(0, 3),
    highlights,
  }
}
