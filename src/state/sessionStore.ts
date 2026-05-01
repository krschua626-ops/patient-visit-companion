import { useSyncExternalStore } from 'react'
import type { ChatMessage, TimeOffset } from '../lib/types'

interface SessionState {
  patientId: string
  visitId: string
  timeOffset: TimeOffset
  checklist: Record<string, boolean>
  messages: ChatMessage[]
  pendingPrompt: string | null
}

const DEFAULT_STATE: SessionState = {
  patientId: 'maria',
  visitId: 'V3',
  timeOffset: 'days_minus_3',
  checklist: {},
  messages: [],
  pendingPrompt: null,
}

let state: SessionState = { ...DEFAULT_STATE }
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

export function getSession(): SessionState {
  return state
}

export function setSession(patch: Partial<SessionState>): void {
  state = { ...state, ...patch }
  notify()
}

export function setPersona(patientId: string): void {
  state = { ...state, patientId, checklist: {}, messages: [] }
  notify()
}

export function setTimeOffset(timeOffset: TimeOffset): void {
  state = { ...state, timeOffset, messages: [] }
  notify()
}

export function setVisit(visitId: string): void {
  state = { ...state, visitId, checklist: {}, messages: [] }
  notify()
}

export function toggleChecklistItem(id: string): void {
  state = { ...state, checklist: { ...state.checklist, [id]: !state.checklist[id] } }
  notify()
}

export function appendMessage(msg: ChatMessage): void {
  state = { ...state, messages: [...state.messages, msg] }
  notify()
}

export function updateMessage(id: string, patch: Partial<ChatMessage>): void {
  state = {
    ...state,
    messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  }
  notify()
}

export function setPendingPrompt(prompt: string | null): void {
  state = { ...state, pendingPrompt: prompt }
  notify()
}

export function resetSession(): void {
  state = { ...DEFAULT_STATE }
  notify()
}

export function useSession(): SessionState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => state,
  )
}
