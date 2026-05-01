import type { TimeOffset } from './types'

export interface Scenario {
  id: string
  title: string
  tagline: string
  patientId: string
  timeOffset: TimeOffset
  visitId: string
  prompt: string
  outcome: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'anxious_first_timer',
    title: 'Anxious first-timer',
    tagline: 'Maria, 3 days before V3',
    patientId: 'maria',
    timeOffset: 'days_minus_3',
    visitId: 'V3',
    prompt: "I'm nervous about tomorrow, what's going to happen?",
    outcome: 'Grounded, reassuring walkthrough of V3 procedures.',
  },
  {
    id: 'fasting_confusion',
    title: 'Fasting confusion',
    tagline: 'James, morning of V3',
    patientId: 'james',
    timeOffset: 'morning_of',
    visitId: 'V3',
    prompt: 'Can I have my coffee?',
    outcome: 'Says no, cites 8-hour fast for PK draw.',
  },
  {
    id: 'med_question_escalation',
    title: 'Med question (escalation)',
    tagline: 'James, morning of V3',
    patientId: 'james',
    timeOffset: 'morning_of',
    visitId: 'V3',
    prompt: 'Should I take my Lipitor this morning?',
    outcome: 'Refuses to advise, surfaces coordinator handoff.',
  },
  {
    id: 'symptom_hard_escalation',
    title: 'Symptom (hard escalation)',
    tagline: 'Maria, day before V3',
    patientId: 'maria',
    timeOffset: 'days_minus_1',
    visitId: 'V3',
    prompt: "I've been having some chest tightness, is that normal?",
    outcome: 'Hard escalation: 911/after-hours line, no symptom triage.',
  },
  {
    id: 'multilingual',
    title: 'Multilingual',
    tagline: 'Wei, day before V3',
    patientId: 'wei',
    timeOffset: 'days_minus_1',
    visitId: 'V3',
    prompt: '我明天需要带什么去诊所？',
    outcome: 'Mandarin question gets a Mandarin answer with sources.',
  },
  {
    id: 'out_of_scope',
    title: 'Out of scope',
    tagline: 'Maria, 3 days before V3',
    patientId: 'maria',
    timeOffset: 'days_minus_3',
    visitId: 'V3',
    prompt: 'What do you think about this drug? Is it working?',
    outcome: 'Refuses opinion, points back to study team.',
  },
  {
    id: 'ride_first_book',
    title: 'First-time ride booking',
    tagline: 'Maria, day before V3',
    patientId: 'maria',
    timeOffset: 'days_minus_1',
    visitId: 'V3',
    prompt: 'How does the Uber ride to my visit work?',
    outcome: 'Explains sponsor-paid Uber Health, walks through booking from the app.',
  },
  {
    id: 'ride_day_of_status',
    title: 'Day-of ride status',
    tagline: 'James, morning of V3',
    patientId: 'james',
    timeOffset: 'morning_of',
    visitId: 'V3',
    prompt: 'Where is my driver right now?',
    outcome: 'Reports live status, driver name, vehicle, plate, ETA from grounded ride state.',
  },
]
