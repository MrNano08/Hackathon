import { formatSeverityLabel, formatZabbixClock } from '../helpers/formatters'
import type { PrioritizedAlert } from '../types/dashboard'
import { MaintenanceBadge } from './MaintenanceBadge'
import { PriorityBadge } from './PriorityBadge'

interface AlertDetailPanelProps {
  alert: PrioritizedAlert | undefined
}

export function AlertDetailPanel({ alert }: AlertDetailPanelProps) {
  if (!alert) {
    return (
      <aside className="detail-panel">
        <p className="eyebrow">Detalle operativo</p>
        <h2>Sin alerta seleccionada</h2>
        <p>No hay datos disponibles para analizar en este momento.</p>
      </aside>
    )
  }

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Detalle operativo</p>
          <h2>{alert.name}</h2>
        </div>
        <div className="detail-badges">
          <PriorityBadge priority={alert.priority} />
          <MaintenanceBadge maintenanceType={alert.maintenanceType} />
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <span>Host/equipo</span>
          <strong>{alert.hostName}</strong>
        </div>
        <div>
          <span>Severidad original</span>
          <strong>
            {alert.severity} - {formatSeverityLabel(alert.severity)}
          </strong>
        </div>
        <div>
          <span>Categoria</span>
          <strong>{alert.category}</strong>
        </div>
        <div>
          <span>Prioridad calculada</span>
          <strong>
            {alert.priority} - score {alert.score}
          </strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>{alert.statusLabel}</strong>
        </div>
        <div>
          <span>Recurrencia detectada</span>
          <strong>
            {alert.recurrenceCount > 1
              ? `${alert.recurrenceCount} eventos similares`
              : 'Sin recurrencia activa'}
          </strong>
        </div>
      </div>

      <section className="detail-copy">
        <h3>Explicacion tipo IA</h3>
        <p>{alert.explanation}</p>
      </section>

      <section className="detail-copy">
        <h3>Recomendacion inicial</h3>
        <p>{alert.recommendation}</p>
      </section>

      <section className="raw-detail">
        <h3>Datos originales relevantes</h3>
        <dl>
          <div>
            <dt>eventid</dt>
            <dd>{alert.eventid}</dd>
          </div>
          <div>
            <dt>clock</dt>
            <dd>
              {alert.clock} - {formatZabbixClock(alert.clock)}
            </dd>
          </div>
          <div>
            <dt>opdata</dt>
            <dd>{alert.opdata || 'Sin datos operativos'}</dd>
          </div>
          <div>
            <dt>senales detectadas</dt>
            <dd>
              {alert.matchedSignals.length > 0
                ? alert.matchedSignals.join(', ')
                : 'Sin palabra critica detectada'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="metrics-detail">
        <h3>Metricas relacionadas desde item.get</h3>
        {alert.relatedMetrics.length === 0 ? (
          <p>No hay metricas asociadas al host de esta alerta.</p>
        ) : (
          <div className="metric-list">
            {alert.relatedMetrics.slice(0, 6).map((metric) => (
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
      </section>
    </aside>
  )
}
