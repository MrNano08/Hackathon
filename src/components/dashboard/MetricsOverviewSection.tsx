import type { ZabbixItemsByHost } from '../../types/zabbix'

interface MetricsOverviewSectionProps {
  itemsByHost: ZabbixItemsByHost
}

export function MetricsOverviewSection({
  itemsByHost,
}: MetricsOverviewSectionProps) {
  return (
    <section className="metrics-section">
      <div>
        <p className="eyebrow">Métricas por host</p>
        <h2>Consulta item.get bajo demanda</h2>
      </div>

      <p>
        El dashboard consulta item.get para hosts asociados a problemas activos
        o una muestra operativa inicial. Hosts con métricas cargadas:{' '}
        <strong>{Object.keys(itemsByHost).length}</strong>.
      </p>
    </section>
  )
}