import { useCallback, useEffect, useState } from 'react'
import { fetchPatientContext } from './api'
import type { PatientVisitContext, TimeOffset } from './types'

interface State {
  data: PatientVisitContext | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePatientContext(
  patientId: string,
  visitId: string,
  timeOffset: TimeOffset,
): State {
  const [data, setData] = useState<PatientVisitContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      const next = await fetchPatientContext(patientId, visitId, timeOffset)
      setData(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [patientId, visitId, timeOffset])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setData(null)
    setError(null)
    fetchPatientContext(patientId, visitId, timeOffset)
      .then((next) => {
        if (!cancelled) {
          setData(next)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [patientId, visitId, timeOffset])

  return { data, loading, error, refetch }
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatDayAndTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  const time = formatTime(iso)
  if (sameDay(d, today)) return `Today, ${time}`
  if (sameDay(d, tomorrow)) return `Tomorrow, ${time}`
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`
}
