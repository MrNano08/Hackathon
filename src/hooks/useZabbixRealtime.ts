import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { classifyAlerts } from '../helpers/alertClassifier'
import { enrichProblemsWithHosts } from '../helpers/zabbixMappers'
import {
  checkZabbixConnection,
  getHosts,
  getItemsForHosts,
  getProblems,
  getZabbixMode,
  getZabbixRefreshSeconds,
  ZABBIX_CONNECTION_ERROR,
  ZABBIX_DASHBOARD_CONNECTION_ERROR,
} from '../services/zabbixService'
import type { PrioritizedAlert } from '../types/dashboard'
import type {
  ZabbixConnectionStatus,
  ZabbixHost,
  ZabbixItemsByHost,
  ZabbixMode,
  ZabbixProblem,
} from '../types/zabbix'

interface UseZabbixRealtimeResult {
  hosts: ZabbixHost[]
  problems: ZabbixProblem[]
  prioritizedAlerts: PrioritizedAlert[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: (nextMode?: ZabbixMode) => Promise<void>
  mode: ZabbixMode
  connectionStatus: ZabbixConnectionStatus
  refreshSeconds: number
  itemsByHost: ZabbixItemsByHost
}

function selectHostsForMetrics(
  hosts: ZabbixHost[],
  problems: ZabbixProblem[],
): ZabbixHost[] {
  const hostIdsWithProblems = new Set(
    problems
      .map((problem) => problem.hostid)
      .filter((hostid): hostid is string => Boolean(hostid)),
  )
  const hostsWithProblems = hosts.filter((host) =>
    hostIdsWithProblems.has(host.hostid),
  )

  if (hostsWithProblems.length > 0) {
    return hostsWithProblems
  }

  return hosts.slice(0, 6)
}

function normalizeDashboardError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === ZABBIX_CONNECTION_ERROR) {
      return ZABBIX_DASHBOARD_CONNECTION_ERROR
    }

    return error.message
  }

  return ZABBIX_DASHBOARD_CONNECTION_ERROR
}

function clearRealData(
  setHosts: (hosts: ZabbixHost[]) => void,
  setProblems: (problems: ZabbixProblem[]) => void,
  setItemsByHost: (itemsByHost: ZabbixItemsByHost) => void,
  setPrioritizedAlerts: (alerts: PrioritizedAlert[]) => void,
) {
  setHosts([])
  setProblems([])
  setItemsByHost({})
  setPrioritizedAlerts([])
}

export function useZabbixRealtime(): UseZabbixRealtimeResult {
  const refreshSeconds = useMemo(() => getZabbixRefreshSeconds(), [])
  const [mode, setMode] = useState<ZabbixMode>(getZabbixMode())
  const [hosts, setHosts] = useState<ZabbixHost[]>([])
  const [problems, setProblems] = useState<ZabbixProblem[]>([])
  const [itemsByHost, setItemsByHost] = useState<ZabbixItemsByHost>({})
  const [prioritizedAlerts, setPrioritizedAlerts] = useState<
    PrioritizedAlert[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isMountedRef = useRef(true)
  const isRequestInFlightRef = useRef(false)
  const modeRef = useRef(mode)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const refresh = useCallback(async (nextMode?: ZabbixMode) => {
    const requestedMode = nextMode ?? modeRef.current

    if (isRequestInFlightRef.current) {
      return
    }

    isRequestInFlightRef.current = true
    setMode(requestedMode)
    setLoading(true)
    setError(null)

    try {
      await checkZabbixConnection(requestedMode)

      const [loadedHosts, loadedProblems] = await Promise.all([
        getHosts(requestedMode),
        getProblems(requestedMode),
      ])
      const enrichedProblems = enrichProblemsWithHosts(
        loadedProblems,
        loadedHosts,
      )
      const metricHosts = selectHostsForMetrics(loadedHosts, enrichedProblems)
      let loadedItemsByHost: ZabbixItemsByHost = {}

      try {
        loadedItemsByHost = await getItemsForHosts(metricHosts, requestedMode)
      } catch {
        loadedItemsByHost = {}
      }

      const classifiedAlerts = classifyAlerts(
        enrichedProblems,
        loadedItemsByHost,
      )

      if (!isMountedRef.current) {
        return
      }

      setHosts(loadedHosts)
      setProblems(enrichedProblems)
      setItemsByHost(loadedItemsByHost)
      setPrioritizedAlerts(classifiedAlerts)
      setLastUpdated(new Date())
    } catch (refreshError) {
      if (!isMountedRef.current) {
        return
      }

      if (requestedMode === 'real') {
        clearRealData(setHosts, setProblems, setItemsByHost, setPrioritizedAlerts)
      }

      setError(normalizeDashboardError(refreshError))
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }

      isRequestInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    void refresh()

    const intervalId = window.setInterval(() => {
      void refresh()
    }, refreshSeconds * 1000)

    return () => {
      isMountedRef.current = false
      window.clearInterval(intervalId)
    }
  }, [refresh, refreshSeconds])

  const connectionStatus = useMemo<ZabbixConnectionStatus>(() => {
    if (mode === 'mock') {
      return 'mock'
    }

    if (loading) {
      return 'loading'
    }

    if (error === ZABBIX_DASHBOARD_CONNECTION_ERROR) {
      return 'disconnected'
    }

    if (error) {
      return 'error'
    }

    return 'connected'
  }, [error, loading, mode])

  return {
    hosts,
    problems,
    prioritizedAlerts,
    loading,
    error,
    lastUpdated,
    refresh,
    mode,
    connectionStatus,
    refreshSeconds,
    itemsByHost,
  }
}
