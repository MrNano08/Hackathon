import { countActiveHosts } from '../helpers/formatters'
import type { PrioritizedAlert, PriorityLevel } from '../types/dashboard'
import type { ZabbixHost, ZabbixMode, ZabbixProblem } from '../types/zabbix'

interface SummaryCardsProps {
  hosts: ZabbixHost[]
  problems: ZabbixProblem[]
  alerts: PrioritizedAlert[]
  mode: ZabbixMode
}

function countPriority(alerts: PrioritizedAlert[], priority: PriorityLevel) {
  return alerts.filter((alert) => alert.priority === priority).length
}

function countRecurrentEvents(alerts: PrioritizedAlert[]) {
  return alerts.filter((alert) => alert.recurrenceCount > 1).length
}

export function SummaryCards({
  hosts,
  problems,
  alerts,
  mode,
}: SummaryCardsProps) {
  const summaryItems = [
    {
      label: 'Total de hosts',
      value: hosts.length,
      detail: `${countActiveHosts(hosts)} activos`,
    },
    {
      label: 'Problemas activos',
      value: problems.length,
      detail: 'Eventos vigentes de problem.get',
    },
    {
      label: 'Alta prioridad',
      value: countPriority(alerts, 'Alta'),
      detail: 'Revisar primero',
    },
    {
      label: 'Media prioridad',
      value: countPriority(alerts, 'Media'),
      detail: 'Atencion programada',
    },
    {
      label: 'Baja prioridad',
      value: countPriority(alerts, 'Baja'),
      detail: 'Seguimiento operativo',
    },
    {
      label: 'Eventos recurrentes',
      value: countRecurrentEvents(alerts),
      detail: 'Mismo nombre repetido',
    },
    {
      label: 'Modo',
      value: mode === 'real' ? 'Real' : 'Demo',
      detail: mode === 'real' ? 'Datos reales por VPN' : 'Datos simulados',
    },
  ]

  return (
    <section className="summary-grid" aria-label="Resumen ejecutivo">
      {summaryItems.map((item) => (
        <article className="summary-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  )
}
