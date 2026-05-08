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
  pre_requirements: Array<{ type: string; hours?: number; minutes?: number; applies_to?: string; description: string }>
  post_requirements: Array<{ type: string; minutes?: number; description?: string }>
  items_to_bring: Array<{ description: string }>
  common_questions: Array<{ question: string; answer: string }>
}

export interface Visit {
  id: string
  name: string
  type: string
  study_day: number
  window_days: number
  estimated_duration_minutes: number
  procedures: string[]
  overrides: Record<string, unknown>
}

export interface PatientTransportation {
  home_address: string
  default_vehicle_preference: 'uberx' | 'uber_comfort' | 'uber_xl' | 'wav'
  wheelchair_accessible_required: boolean
  ride_with_caregiver_default: boolean
  notes_for_driver: string
}

export interface StudyTransportation {
  provider: string
  sponsor_paid: boolean
  site_address: string
  default_pickup_buffer_minutes: number
  post_visit_pickup_buffer_minutes: number
  supports_caregiver_rider: boolean
  supports_wheelchair_accessible: boolean
  support_phone: string
  policy_summary: string
}

export type SymptomSeverity = 'none' | 'mild' | 'moderate' | 'severe' | 'good' | 'fair' | 'poor'

export interface SymptomEntry {
  symptom_id: string
  current_severity: SymptomSeverity
  trend: 'improving' | 'stable' | 'worsening'
  last_seven_days: SymptomSeverity[]
}

export interface EproState {
  daily_symptom_diary?: { streak_days?: number; last_completed_hours_ago?: number }
  weekly_wellbeing?: { last_completed_days_ago?: number }
  pre_visit_check?: { ever_completed: boolean; last_completed_days_ago?: number }
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
  transportation: PatientTransportation
  epro_state: EproState
  symptom_history: SymptomEntry[]
}

export interface EproAssessment {
  id: string
  name: string
  description: string
  estimated_minutes: number
  frequency: 'daily' | 'weekly' | 'per_visit'
  due_time_local?: string
  due_day?: string
  instrument: string
}

export interface TrackedSymptom {
  id: string
  name: string
  scale: 'severity_4' | 'severity_4_inverse'
}

export interface NextEproActivity {
  assessment: EproAssessment
  status: 'overdue' | 'due_now' | 'due_soon' | 'on_track'
  due_label: string
  cta_label: string
  last_completed_label: string | null
  streak_days?: number
}

export interface HomeContext {
  patient: Patient
  study: {
    short_title: string
    sponsor: string
    coordinator_name: string
    coordinator_phone: string
  }
  next_epro: NextEproActivity | null
  upcoming_epros: NextEproActivity[]
  symptoms: Array<SymptomEntry & { name: string; scale: TrackedSymptom['scale'] }>
  next_visit: {
    id: string
    name: string
    timing_label: string
    is_today: boolean
  } | null
  greeting: string
}

export type RideStatus =
  | 'not_booked'
  | 'booking'
  | 'confirmed'
  | 'driver_assigned'
  | 'en_route_to_pickup'
  | 'arrived_at_pickup'
  | 'in_transit'
  | 'completed'
  | 'cancelled'

export type RideLeg = 'outbound' | 'return'

export interface Ride {
  id: string
  patient_id: string
  visit_id: string
  leg: RideLeg
  status: RideStatus
  pickup_address: string
  dropoff_address: string
  scheduled_pickup_iso: string
  vehicle_preference: PatientTransportation['default_vehicle_preference']
  wheelchair_accessible: boolean
  with_caregiver: boolean
  caregiver_name: string | null
  notes_for_driver: string
  driver: { name: string; vehicle: string; license_plate: string; rating: number } | null
  estimated_eta_minutes: number | null
  estimated_cost_usd: number
  sponsor_paid: boolean
  confirmation_code: string
  booked_at_iso: string
  status_updated_iso: string
}

export interface Study {
  study_id: string
  title: string
  short_title: string
  sponsor: string
  indication: string
  phase: string
  investigational_product: string
  site_name: string
  coordinator_name: string
  coordinator_phone: string
  coordinator_hours: string
  after_hours_line: string
  transportation: StudyTransportation
  epro_assessments: EproAssessment[]
  tracked_symptoms: TrackedSymptom[]
  visits: Visit[]
  study_faq: Array<{ id: string; question: string; answer: string }>
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
  transportation: {
    sponsor_paid: boolean
    provider: string
    home_address: string
    site_address: string
    default_vehicle_preference: PatientTransportation['default_vehicle_preference']
    wheelchair_accessible_required: boolean
    caregiver_default: boolean
    suggested_outbound_pickup_iso: string
    suggested_return_pickup_iso: string
    policy_summary: string
    outbound_ride: Ride | null
    return_ride: Ride | null
  }
  briefing_card: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface SuggestedAction {
  label: string
  kind: 'prompt' | 'link' | 'tel'
  value: string
}

export interface ChatResponse {
  reply: string
  confidence: 'high' | 'medium' | 'low'
  escalation_recommended: boolean
  escalation_summary?: string
  grounding_sources: string[]
  suggested_actions?: SuggestedAction[]
  highlights?: string[]
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
