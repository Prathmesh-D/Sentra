import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filesService } from '@/api'
import type { EncryptedFile } from '@/api'

const TAB_COUNTS_STORAGE_KEY = 'tab_counts'
const LEGACY_NOTIFICATION_STORAGE_KEY = 'sentra_notifications'
const TAB_COUNTS_REFRESH_EVENT = 'tab-counts:refresh'

type TabKey = 'inbox' | 'outbox'

type OutboxSnapshot = Record<string, {
  downloadCount: number
  status: EncryptedFile['status']
  createdAt: string
}>

type TabCounts = {
  inbox: number
  outbox: number
}

type PersistedContextState = {
  inboxLastViewedAt: string
  outboxLastViewedAt: string
  outboxSnapshot: OutboxSnapshot
  counts: TabCounts
  updatedAt: string
}

type PersistedTabCounts = {
  version: 1
  contexts: Record<string, PersistedContextState>
}

const getNowIso = () => new Date().toISOString()

const createDefaultContextState = (): PersistedContextState => ({
  inboxLastViewedAt: getNowIso(),
  outboxLastViewedAt: getNowIso(),
  outboxSnapshot: {},
  counts: { inbox: 0, outbox: 0 },
  updatedAt: getNowIso(),
})

const buildOutboxSnapshot = (files: EncryptedFile[]): OutboxSnapshot => {
  const snapshot: OutboxSnapshot = {}
  for (const file of files) {
    snapshot[file.id] = {
      downloadCount: file.download_count,
      status: file.status,
      createdAt: file.created_at,
    }
  }
  return snapshot
}

const safeParse = (raw: string | null): PersistedTabCounts => {
  if (!raw) return { version: 1, contexts: {} }
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !parsed?.contexts || typeof parsed.contexts !== 'object') {
      return { version: 1, contexts: {} }
    }
    return parsed as PersistedTabCounts
  } catch {
    return { version: 1, contexts: {} }
  }
}

const readStorage = (): PersistedTabCounts => {
  if (typeof window === 'undefined') return { version: 1, contexts: {} }
  try {
    return safeParse(localStorage.getItem(TAB_COUNTS_STORAGE_KEY))
  } catch (error) {
    console.error('Failed to read tab count storage:', error)
    return { version: 1, contexts: {} }
  }
}

const writeStorage = (value: PersistedTabCounts) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TAB_COUNTS_STORAGE_KEY, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to write tab count storage:', error)
  }
}

const resolveContextState = (storage: PersistedTabCounts, contextKey: string): PersistedContextState => {
  return storage.contexts[contextKey] ?? createDefaultContextState()
}

const countInboxUpdates = (files: EncryptedFile[], inboxLastViewedAt: string): number => {
  const baseline = new Date(inboxLastViewedAt).getTime()
  if (Number.isNaN(baseline)) return 0
  return files.filter((file) => new Date(file.created_at).getTime() > baseline).length
}

const countOutboxUpdates = (files: EncryptedFile[], contextState: PersistedContextState): number => {
  const baseline = new Date(contextState.outboxLastViewedAt).getTime()
  if (Number.isNaN(baseline)) return 0

  let changes = 0
  for (const file of files) {
    const previous = contextState.outboxSnapshot[file.id]
    if (!previous) {
      if (new Date(file.created_at).getTime() > baseline) {
        changes += 1
      }
      continue
    }
    if (file.download_count > previous.downloadCount || file.status !== previous.status) {
      changes += 1
    }
  }
  return changes
}

export interface UseTabCountsResult {
  counts: TabCounts
  isLoading: boolean
  recount: () => Promise<TabCounts>
  markTabViewed: (tab: TabKey) => Promise<void>
  markInboxViewed: () => Promise<void>
  markOutboxViewed: () => Promise<void>
}

export function requestTabCountsRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TAB_COUNTS_REFRESH_EVENT))
}

export function useTabCounts(contextKey: string | null, enabled: boolean): UseTabCountsResult {
  const [counts, setCounts] = useState<TabCounts>({ inbox: 0, outbox: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const lastOutboxRef = useRef<EncryptedFile[]>([])
  const countsRef = useRef<TabCounts>({ inbox: 0, outbox: 0 })

  const applyCounts = useCallback((nextCounts: TabCounts) => {
    const normalized = {
      inbox: Math.max(0, nextCounts.inbox),
      outbox: Math.max(0, nextCounts.outbox),
    }
    countsRef.current = normalized
    setCounts((prev) => {
      if (prev.inbox === normalized.inbox && prev.outbox === normalized.outbox) {
        return prev
      }
      return normalized
    })
  }, [])

  const recount = useCallback(async (): Promise<TabCounts> => {
    if (!enabled || !contextKey) {
      applyCounts({ inbox: 0, outbox: 0 })
      return { inbox: 0, outbox: 0 }
    }

    setIsLoading(true)
    try {
      const [inboxResponse, outboxResponse] = await Promise.all([
        filesService.getInbox(),
        filesService.getOutbox(),
      ])

      const inboxFiles = inboxResponse.files || []
      const outboxFiles = outboxResponse.files || []
      lastOutboxRef.current = outboxFiles

      const storage = readStorage()
      let contextState = resolveContextState(storage, contextKey)

      // First login for a context starts clean and sets a baseline snapshot.
      if (!storage.contexts[contextKey]) {
        contextState = {
          ...contextState,
          outboxSnapshot: buildOutboxSnapshot(outboxFiles),
        }
        storage.contexts[contextKey] = contextState
        writeStorage(storage)
        applyCounts({ inbox: 0, outbox: 0 })
        return { inbox: 0, outbox: 0 }
      }

      const nextCounts = {
        inbox: countInboxUpdates(inboxFiles, contextState.inboxLastViewedAt),
        outbox: countOutboxUpdates(outboxFiles, contextState),
      }

      contextState = {
        ...contextState,
        counts: nextCounts,
        updatedAt: getNowIso(),
      }
      storage.contexts[contextKey] = contextState
      writeStorage(storage)
      applyCounts(nextCounts)
      return nextCounts
    } catch (error) {
      console.error('Failed to recount tab badges:', error)
      return countsRef.current
    } finally {
      setIsLoading(false)
    }
  }, [enabled, contextKey, applyCounts])

  const markTabViewed = useCallback(async (tab: TabKey) => {
    if (!enabled || !contextKey) return

    const storage = readStorage()
    const contextState = resolveContextState(storage, contextKey)

    if (tab === 'inbox') {
      contextState.inboxLastViewedAt = getNowIso()
      contextState.counts = { ...contextState.counts, inbox: 0 }
    } else {
      let outboxFiles = lastOutboxRef.current
      if (outboxFiles.length === 0) {
        try {
          const response = await filesService.getOutbox()
          outboxFiles = response.files || []
          lastOutboxRef.current = outboxFiles
        } catch (error) {
          console.error('Failed to refresh outbox snapshot:', error)
        }
      }
      contextState.outboxLastViewedAt = getNowIso()
      contextState.outboxSnapshot = buildOutboxSnapshot(outboxFiles)
      contextState.counts = { ...contextState.counts, outbox: 0 }
    }

    contextState.updatedAt = getNowIso()
    storage.contexts[contextKey] = contextState
    writeStorage(storage)
    applyCounts(contextState.counts)
  }, [enabled, contextKey, applyCounts])

  const markInboxViewed = useCallback(() => markTabViewed('inbox'), [markTabViewed])
  const markOutboxViewed = useCallback(() => markTabViewed('outbox'), [markTabViewed])

  useEffect(() => {
    if (!enabled || !contextKey) {
      applyCounts({ inbox: 0, outbox: 0 })
      return
    }

    // One-time migration cleanup for removed notification storage.
    try {
      localStorage.removeItem(LEGACY_NOTIFICATION_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clean legacy notification storage:', error)
    }

    const storage = readStorage()
    const state = storage.contexts[contextKey]
    applyCounts(state?.counts ?? { inbox: 0, outbox: 0 })

    recount()
  }, [enabled, contextKey, recount, applyCounts])

  useEffect(() => {
    const handleRefresh = () => {
      recount()
    }

    window.addEventListener(TAB_COUNTS_REFRESH_EVENT, handleRefresh)
    return () => {
      window.removeEventListener(TAB_COUNTS_REFRESH_EVENT, handleRefresh)
    }
  }, [recount])

  // Polling effect: automatically check for new items every 45 seconds
  useEffect(() => {
    if (!enabled || !contextKey) return

    const pollInterval = setInterval(() => {
      recount()
    }, 45000) // 45 seconds

    return () => clearInterval(pollInterval)
  }, [enabled, contextKey, recount])

  return useMemo(() => ({
    counts,
    isLoading,
    recount,
    markTabViewed,
    markInboxViewed,
    markOutboxViewed,
  }), [counts, isLoading, recount, markTabViewed, markInboxViewed, markOutboxViewed])
}
