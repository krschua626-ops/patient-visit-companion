export type TimeOffset =
  | 'days_minus_3'
  | 'days_minus_1'
  | 'morning_of'
  | 'post_visit'
  | 'days_plus_3'

export interface Procedure {
  code: string
  patient_friendly_name: string
  plain_language_description: string
  estimated_duration_minutes: number
  pre_requirements: Array<{ type: string; description: string }>
  post_requirements: Array<{ type: string; description?: string }>
  items_to_bring: Array<{ description: string }>
  common_questions: Array<{ question: string; answer: string }>
}

export interface Patient {
  id: string
  name: string
  first_name: string
  age: number
  language: string
  language_label: string
  cohort: string
  current_visit_id: string
  trial_experience: string
  concomitant_meds: Array<{ name: string; dose: string; frequency: string }>
  history_flags: Array<{ type: string; description: string }>
  accessibility_flags: Array<{ type: string; description: string }>
  personality_notes: string
  caregiver: { name: string; relationship: string } | null
}

export interface PatientVisitContext {
  patient: Patient
  study: {
    short_title: string
    sponsor: string
    indication: string
    investigational_product: string
    site_name: string
    coordinator_name: string
    coordinator_phone: string
    after_hours_line: string
  }
  visit: {
    id: string
    name: string
    type: string
    study_day: number
    procedures: Procedure[]
    total_duration_minutes: number
    pre_requirements: Array<{ type: string; description: string; source_procedure: string }>
    post_requirements: Array<{ type: string; description: string; source_procedure: string }>
    items_to_bring: Array<{ description: string; source_procedure: string }>
  }
  timing: {
    offset: TimeOffset
    label: string
    is_past: boolean
    days_until: number | null
  }
  outstanding_tasks: Array<{ id: string; label: string; status: 'pending' | 'done' }>
  briefing_card: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatMessage extends ChatTurn {
  id: string
  confidence?: 'high' | 'medium' | 'low'
  escalation_recommended?: boolean
  escalation_summary?: string
  grounding_sources?: string[]
  isPending?: boolean
  isError?: boolean
}

export interface ChatResponse {
  reply: string
  confidence: 'high' | 'medium' | 'low'
  escalation_recommended: boolean
  escalation_summary?: string
  grounding_sources: string[]
}

export interface AuditEntry {
  id: string
  timestamp: string
  patient_id: string
  visit_id: string
  time_offset: TimeOffset
  user_message: string
  retrieved_context_summary: string
  system_prompt_summary: string
  reply: string
  confidence: 'high' | 'medium' | 'low'
  escalation_recommended: boolean
  grounding_sources: string[]
  latency_ms: number
}

export const TIME_OFFSET_LABELS: Record<TimeOffset, string> = {
  days_minus_3: '3 days before V3',
  days_minus_1: 'Day before V3',
  morning_of: 'Morning of V3',
  post_visit: 'Post-V3',
  days_plus_3: '3 days before V4',
}
