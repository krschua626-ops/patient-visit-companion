import type { AuditEntry } from './types.js'

const MAX_ENTRIES = 100
let buffer: AuditEntry[] = []

export function logAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  }
  buffer.unshift(full)
  if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(0, MAX_ENTRIES)
  return full
}

export function getAuditLog(): AuditEntry[] {
  return buffer
}

export function resetAuditLog(): void {
  buffer = []
}
