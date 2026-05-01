import { useEffect, useState } from 'react'
import { fetchPatientContext } from './api'
import type { PatientVisitContext, TimeOffset } from './types'

interface State {
  data: PatientVisitContext | null
  loading: boolean
  error: string | null
}

export function usePatientContext(
  patientId: string,
  visitId: string,
  timeOffset: TimeOffset,
): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })
    fetchPatientContext(patientId, visitId, timeOffset)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [patientId, visitId, timeOffset])

  return state
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}
