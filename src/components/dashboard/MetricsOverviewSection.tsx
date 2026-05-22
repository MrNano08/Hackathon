import type { ZabbixItem, ZabbixItemsByHost } from '../../types/zabbix'

interface MetricsOverviewSectionProps {
  itemsByHost: ZabbixItemsByHost
}

function parseMetricValue(value: string) {
  const normalized = value.replace(',', '.').trim()
  const match = normalized.match(/-?\d+(\.\d+)?/)

  return match ? Number(match[0]) : Number.NaN
}

function isMetricAttentionCandidate(metric: ZabbixItem) {
  const text = `${metric.name} ${metric.key_}`.toLowerCase()
  const value = parseMetricValue(metric.lastvalue)

  if (text.includes('icmpping') || text.includes('icmp availability')) {
    return value === 0
  }

  if (text.includes('cpu') || text.includes('utilization')) return value >= 80
  if (text.includes('bandwidth') || text.includes('net.if.util')) return value >= 85
  if (text.includes('temperature')) return value >= 60
  if (text.includes('optical') || text.includes('net.optical')) return value <= -23
  if (text.includes('loss')) return value >= 3
  if (text.includes('latency')) return value >= 80
  if (text.includes('jitter')) return value >= 20
  if (text.includes('sip') || text.includes('failures')) return value >= 1
  if (text.includes('status') || text.includes('uplink')) return value !== 1

  return false
}

export function MetricsOverviewSection({
  itemsByHost,
}: MetricsOverviewSectionProps) {
  const hostEntries = Object.entries(itemsByHost)
  const totalMetrics = hostEntries.reduce(
    (total, [, metrics]) => total + metrics.length,
    0,
  )
  const attentionMetrics = hostEntries.reduce(
    (total, [, metrics]) =>
      total + metrics.filter(isMetricAttentionCandidate).length,
    0,
  )

  return (
    <section className="metrics-section">
      <div>
        <p className="eyebrow">Métricas por host</p>
        <h2>De datos técnicos a lectura operativa</h2>
      </div>

      <p>
        El dashboard consulta item.get para hosts asociados a problemas activos
        o una muestra operativa inicial. Actualmente hay{' '}
        <strong>{hostEntries.length}</strong> hosts con métricas,{' '}
        <strong>{totalMetrics}</strong> valores leídos y{' '}
        <strong>{attentionMetrics}</strong> señales que podrían requerir revisión
        técnica.
      </p>
    </section>
  )
}
