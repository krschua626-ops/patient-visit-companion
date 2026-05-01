import { useCallback, useEffect, useState } from 'react'
import { fetchHomeContext } from './api'
import type { HomeContext, TimeOffset } from './types'

interface State {
  data: HomeContext | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useHomeContext(patientId: string, timeOffset: TimeOffset): State {
  const [data, setData] = useState<HomeContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      const next = await fetchHomeContext(patientId, timeOffset)
      setData(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [patientId, timeOffset])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setData(null)
    setError(null)
    fetchHomeContext(patientId, timeOffset)
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
  }, [patientId, timeOffset])

  return { data, loading, error, refetch }
}
