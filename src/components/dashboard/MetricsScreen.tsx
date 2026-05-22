import type { ZabbixItemsByHost } from '../../types/zabbix'

interface MetricsScreenProps {
  itemsByHost: ZabbixItemsByHost
}

export function MetricsScreen({ itemsByHost }: MetricsScreenProps) {
  const hostEntries = Object.entries(itemsByHost)

  return (
    <section className="screen-card metrics-screen-card">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Métricas por host</p>
          <h2>Consulta item.get bajo demanda</h2>
          <p>
            El dashboard consulta métricas de hosts asociados a problemas
            activos o a una muestra operativa inicial.
          </p>
        </div>

        <div className="metric-counter">
          <strong>{hostEntries.length}</strong>
          <span>hosts con métricas</span>
        </div>
      </div>

      {hostEntries.length === 0 ? (
        <div className="empty-state-box">
          No hay métricas cargadas todavía. Actualiza los datos o revisa la
          conexión con Zabbix.
        </div>
      ) : (
        <div className="host-metrics-grid">
          {hostEntries.map(([hostId, metrics]) => (
            <article className="host-metric-card" key={hostId}>
              <div className="host-metric-header">
                <span>Host ID</span>
                <strong>{hostId}</strong>
              </div>

              {metrics.length === 0 ? (
                <p>No hay métricas disponibles para este host.</p>
              ) : (
                <div className="metric-list">
                  {metrics.slice(0, 8).map((metric) => (
                    <div className="metric-pill" key={metric.itemid}>
                      <span>{metric.name}</span>
                      <strong>
                        {metric.lastvalue}
                        {metric.units ?? ''}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}