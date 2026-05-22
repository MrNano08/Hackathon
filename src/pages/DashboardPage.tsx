import { useMemo, useState } from 'react'
import { DashboardHeader } from '../components/DashboardHeader'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { ZabbixDebugPanel } from '../components/ZabbixDebugPanel'
import { AlertDetailScreen } from '../components/dashboard/AlertDetailScreen'
import { BeforeAfterAnalysisView } from '../components/dashboard/BeforeAfterAnalysisView'
import {
  DashboardNavigation,
  type DashboardScreen,
} from '../components/dashboard/DashboardNavigation'
import { MetricsScreen } from '../components/dashboard/MetricsScreen'
import { OverviewScreen } from '../components/dashboard/OverviewScreen'
import { useZabbixRealtime } from '../hooks/useZabbixRealtime'
import { getZabbixApiUrl } from '../services/zabbixService'
import { VisualMetricsScreen } from '../components/dashboard/VisualMetricsScreen'

export function DashboardPage() {
  const {
    hosts,
    problems,
    prioritizedAlerts,
    loading,
    error,
    lastUpdated,
    refresh,
    mode,
    refreshSeconds,
    connectionStatus,
    itemsByHost,
  } = useZabbixRealtime()

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [activeScreen, setActiveScreen] = useState<DashboardScreen>('resumen')

  const selectedAlert = useMemo(
    () =>
      prioritizedAlerts.find((alert) => alert.eventid === selectedAlertId) ??
      prioritizedAlerts[0],
    [prioritizedAlerts, selectedAlertId],
  )

  const isInitialLoading =
    loading && problems.length === 0 && prioritizedAlerts.length === 0 && !error

  const handleRefresh = () => {
    void refresh()
  }

  const handleUseDemo = () => {
    void refresh('mock')
  }

  const handleSelectAlert = (eventid: string) => {
    setSelectedAlertId(eventid)
  }

  const renderActiveScreen = () => {
    if (activeScreen === 'analisis') {
      return (
        <BeforeAfterAnalysisView
          problems={problems}
          prioritizedAlerts={prioritizedAlerts}
          selectedAlert={selectedAlert}
          onSelectAlert={handleSelectAlert}
        />
      )
    }

    if (activeScreen === 'visuales') {
  return (
    <VisualMetricsScreen
      problems={problems}
      alerts={prioritizedAlerts}
    />
  )
}
    if (activeScreen === 'detalle') {
      return <AlertDetailScreen selectedAlert={selectedAlert} />
    }

    if (activeScreen === 'metricas') {
      return <MetricsScreen itemsByHost={itemsByHost} />
    }

    if (activeScreen === 'debug') {
      return <ZabbixDebugPanel visible={mode === 'real'} />
    }

    return (
      <OverviewScreen
        hosts={hosts}
        problems={problems}
        alerts={prioritizedAlerts}
        mode={mode}
      />
    )
  }

  return (
    <main className="dashboard-shell">
      <DashboardHeader
        mode={mode}
        apiUrl={getZabbixApiUrl()}
        loading={loading}
        error={error}
        connectionStatus={connectionStatus}
        refreshSeconds={refreshSeconds}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
      />

      {error ? (
        <ErrorState
          message={error}
          onRetry={handleRefresh}
          onUseDemo={mode === 'real' ? handleUseDemo : undefined}
        />
      ) : null}

      {isInitialLoading ? (
        <LoadingState message="Consultando Zabbix en tiempo casi real..." />
      ) : (
        <>
          <DashboardNavigation
            activeScreen={activeScreen}
            onChangeScreen={setActiveScreen}
            showDebug={mode === 'real'}
          />

          {renderActiveScreen()}
        </>
      )}
    </main>
  )
}