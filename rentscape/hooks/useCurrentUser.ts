import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type CurrentUser = {
  id: string
  email?: string
  role: 'tenant' | 'landlord' | 'admin'
  full_name: string
}

type Snapshot = {
  user: CurrentUser | null
  isLoading: boolean
  error: string | null
}

let snapshot: Snapshot = {
  user: null,
  isLoading: true,
  error: null,
}

let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setSnapshot(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  emit()
}

async function fetchMe() {
  if (inFlight) return inFlight

  inFlight = (async () => {
    setSnapshot({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message = payload?.error || 'Failed to load current user.'
        setSnapshot({ user: null, error: message, isLoading: false })
        return
      }

      setSnapshot({ user: payload?.user ?? null, error: null, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load current user.'
      setSnapshot({ user: null, error: message, isLoading: false })
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

export function useCurrentUser() {
  const store = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
    () => snapshot
  )

  useEffect(() => {
    // Avoid multiple callers triggering multiple requests.
    if (snapshot.isLoading && !snapshot.user && !snapshot.error) {
      void fetchMe()
    } else if (!snapshot.user && !snapshot.isLoading && !snapshot.error) {
      void fetchMe()
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchMe()
  }, [])

  return { ...store, refresh }
}

// to reset user after logout
export function resetCurrentUser() {
  snapshot = { user: null, isLoading: true, error: null }
  inFlight = null
  emit()
  void fetchMe()
}