import { useMemo, useState } from 'react'
import { AlertDetailPanel } from '../components/AlertDetailPanel'
import { DashboardHeader } from '../components/DashboardHeader'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { PrioritizedAlertsTable } from '../components/PrioritizedAlertsTable'
import { RawEventsTable } from '../components/RawEventsTable'
import { SummaryCards } from '../components/SummaryCards'
import { ZabbixDebugPanel } from '../components/ZabbixDebugPanel'
import { useZabbixRealtime } from '../hooks/useZabbixRealtime'
import { getZabbixApiUrl } from '../services/zabbixService'

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
        <>
          <ErrorState
            message={error}
            onRetry={handleRefresh}
            onUseDemo={mode === 'real' ? handleUseDemo : undefined}
          />

          <ZabbixDebugPanel visible={mode === 'real'} />
        </>
      ) : null}

      {isInitialLoading ? (
        <LoadingState message="Consultando Zabbix en tiempo casi real..." />
      ) : (
        <>
          <SummaryCards
            hosts={hosts}
            problems={problems}
            alerts={prioritizedAlerts}
            mode={mode}
          />

          <section className="comparison-section">
            <div className="section-heading">
              <p className="eyebrow">Análisis operativo</p>
              <h2>Antes y después del análisis</h2>
            </div>

            <div className="comparison-grid">
              <section className="analysis-block">
                <div className="block-heading">
                  <span>ANTES</span>
                  <h3>Antes: eventos técnicos sin priorizar</h3>
                </div>

                <p>
                  Información original obtenida desde Zabbix mediante
                  problem.get. Se muestra sin interpretación adicional para
                  evidenciar el punto de partida técnico.
                </p>

                <RawEventsTable
                  problems={problems}
                  selectedEventId={selectedAlert?.eventid ?? null}
                  onSelectProblem={setSelectedAlertId}
                />
              </section>

              <section className="analysis-block analysis-block-strong">
                <div className="block-heading">
                  <span>DESPUÉS</span>
                  <h3>Después: alertas priorizadas y explicadas</h3>
                </div>

                <p>
                  Los mismos eventos reales se ordenan por prioridad y se
                  enriquecen con categoría, explicación, mantenimiento sugerido
                  y primera acción recomendada.
                </p>

                <PrioritizedAlertsTable
                  alerts={prioritizedAlerts}
                  selectedAlertId={selectedAlert?.eventid ?? null}
                  onSelectAlert={setSelectedAlertId}
                />
              </section>
            </div>
          </section>

          <section className="detail-section">
            <AlertDetailPanel alert={selectedAlert} />
          </section>

          <section className="metrics-section">
            <div>
              <p className="eyebrow">Métricas por host</p>
              <h2>Consulta item.get bajo demanda</h2>
            </div>

            <p>
              El dashboard consulta item.get para hosts asociados a problemas
              activos o una muestra operativa inicial. Hosts con métricas
              cargadas: {Object.keys(itemsByHost).length}.
            </p>
          </section>

          <section className="predictive-note">
            <h2>Alcance del apoyo predictivo</h2>

            <p>
              El sistema identifica recurrencia, severidad y señales operativas
              para apoyar mantenimiento preventivo, predictivo y correctivo. No
              afirma predicción exacta de fallas.
            </p>
          </section>
        </>
      )}
    </main>
  )
}