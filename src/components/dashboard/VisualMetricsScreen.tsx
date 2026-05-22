import type { MaintenanceType, PrioritizedAlert, PriorityLevel } from '../../types/dashboard'
import type { ZabbixProblem } from '../../types/zabbix'

interface VisualMetricsScreenProps {
  problems: ZabbixProblem[]
  alerts: PrioritizedAlert[]
}

interface MetricCount {
  label: string
  value: number
}

function countByPriority(alerts: PrioritizedAlert[], priority: PriorityLevel) {
  return alerts.filter((alert) => alert.priority === priority).length
}

function countByMaintenance(
  alerts: PrioritizedAlert[],
  maintenanceType: MaintenanceType,
) {
  return alerts.filter((alert) => alert.maintenanceType === maintenanceType)
    .length
}

function countBySeverity(problems: ZabbixProblem[], severity: string) {
  return problems.filter((problem) => problem.severity === severity).length
}

function getPercent(value: number, total: number) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

function BarMetric({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total: number
}) {
  const percent = getPercent(value, total)

  return (
    <div className="visual-bar-row">
      <div className="visual-bar-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="visual-bar-track">
        <div className="visual-bar-fill" style={{ width: `${percent}%` }} />
      </div>

      <small>{percent}%</small>
    </div>
  )
}

function DonutChart({ data }: { data: MetricCount[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const first = total === 0 ? 0 : (data[0]?.value ?? 0) / total
  const second = total === 0 ? 0 : (data[1]?.value ?? 0) / total
  const firstEnd = first * 360
  const secondEnd = firstEnd + second * 360

  const background =
    total === 0
      ? '#e5ecee'
      : `conic-gradient(
          var(--brand) 0deg ${firstEnd}deg,
          var(--accent-blue) ${firstEnd}deg ${secondEnd}deg,
          var(--danger) ${secondEnd}deg 360deg
        )`

  return (
    <div className="donut-layout">
      <div className="donut-chart" style={{ background }}>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>alertas</span>
        </div>
      </div>

      <div className="donut-legend">
        {data.map((item, index) => (
          <div className="donut-legend-item" key={item.label}>
            <span className={`legend-dot legend-dot-${index + 1}`} />
            <p>
              {item.label}
              <strong>{item.value}</strong>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VisualMetricsScreen({
  problems,
  alerts,
}: VisualMetricsScreenProps) {
  const totalAlerts = alerts.length
  const recurrentAlerts = alerts.filter((alert) => alert.recurrenceCount > 1)
    .length

  const priorityData: MetricCount[] = [
    { label: 'Alta', value: countByPriority(alerts, 'Alta') },
    { label: 'Media', value: countByPriority(alerts, 'Media') },
    { label: 'Baja', value: countByPriority(alerts, 'Baja') },
  ]

  const maintenanceData: MetricCount[] = [
    {
      label: 'Preventivo',
      value: countByMaintenance(alerts, 'Preventivo'),
    },
    {
      label: 'Predictivo',
      value: countByMaintenance(alerts, 'Predictivo'),
    },
    {
      label: 'Correctivo',
      value: countByMaintenance(alerts, 'Correctivo'),
    },
  ]

  const severityData: MetricCount[] = [
    { label: 'Desastre', value: countBySeverity(problems, '5') },
    { label: 'Alta', value: countBySeverity(problems, '4') },
    { label: 'Promedio', value: countBySeverity(problems, '3') },
    { label: 'Advertencia', value: countBySeverity(problems, '2') },
    { label: 'Información', value: countBySeverity(problems, '1') },
  ]

  const topAlerts = [...alerts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return (
    <section className="screen-card visual-screen-card">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Métricas visuales</p>
          <h2>Lectura rápida del estado operativo</h2>
          <p>
            Esta pantalla resume los eventos en gráficos simples para explicar
            prioridad, severidad, recurrencia y tipo de mantenimiento sin
            depender únicamente de tablas.
          </p>
        </div>
      </div>

      <div className="visual-kpi-grid">
        <article className="visual-kpi-card">
          <span>Total de alertas</span>
          <strong>{totalAlerts}</strong>
          <p>Eventos procesados por la lógica de priorización.</p>
        </article>

        <article className="visual-kpi-card">
          <span>Recurrentes</span>
          <strong>{recurrentAlerts}</strong>
          <p>Alertas que aparecen más de una vez y requieren revisión.</p>
        </article>

        <article className="visual-kpi-card">
          <span>Riesgo alto</span>
          <strong>{countByPriority(alerts, 'Alta')}</strong>
          <p>Casos que deberían revisarse primero.</p>
        </article>

        <article className="visual-kpi-card">
          <span>Correctivo</span>
          <strong>{countByMaintenance(alerts, 'Correctivo')}</strong>
          <p>Eventos que sugieren atención inmediata.</p>
        </article>
      </div>

      <div className="visual-grid">
        <article className="visual-panel">
          <div className="visual-panel-header">
            <h3>Distribución por prioridad</h3>
            <p>Clasificación generada después del análisis.</p>
          </div>

          <div className="visual-bars">
            {priorityData.map((item) => (
              <BarMetric
                key={item.label}
                label={item.label}
                value={item.value}
                total={totalAlerts}
              />
            ))}
          </div>
        </article>

        <article className="visual-panel">
          <div className="visual-panel-header">
            <h3>Tipo de mantenimiento</h3>
            <p>Lectura para decidir enfoque operativo.</p>
          </div>

          <DonutChart data={maintenanceData} />
        </article>

        <article className="visual-panel">
          <div className="visual-panel-header">
            <h3>Severidad original de Zabbix</h3>
            <p>Dato técnico antes de la interpretación.</p>
          </div>

          <div className="visual-bars">
            {severityData.map((item) => (
              <BarMetric
                key={item.label}
                label={item.label}
                value={item.value}
                total={problems.length}
              />
            ))}
          </div>
        </article>

        <article className="visual-panel">
          <div className="visual-panel-header">
            <h3>Top alertas por puntaje</h3>
            <p>Eventos con mayor prioridad calculada.</p>
          </div>

          {topAlerts.length === 0 ? (
            <div className="empty-state-box">No hay alertas para mostrar.</div>
          ) : (
            <div className="top-alert-list">
              {topAlerts.map((alert, index) => (
                <div className="top-alert-item" key={alert.eventid}>
                  <span>{index + 1}</span>

                  <div>
                    <strong>{alert.name}</strong>
                    <p>
                      {alert.priority} · {alert.maintenanceType} · Puntaje{' '}
                      {alert.score}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
