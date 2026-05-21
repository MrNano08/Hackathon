import type { ZabbixHost } from '../types/zabbix'

const severityLabels: Record<string, string> = {
  '0': 'No clasificada',
  '1': 'Informativa',
  '2': 'Advertencia',
  '3': 'Promedio',
  '4': 'Alta',
  '5': 'Desastre',
}

export function formatZabbixClock(clock?: string): string {
  const timestamp = Number(clock)

  if (!timestamp) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp * 1000))
}

export function formatAcknowledged(value?: string): string {
  return value === '1' ? 'Si' : 'No'
}

export function formatEventStatus(value?: string): string {
  return value === '1' ? 'Reconocida' : 'Pendiente'
}

export function formatSeverityLabel(severity: string): string {
  return severityLabels[severity] ?? `Severidad ${severity}`
}

export function formatHostStatus(status: string): string {
  return status === '0' ? 'Activo' : 'No monitoreado'
}

export function countActiveHosts(hosts: ZabbixHost[]): number {
  return hosts.filter((host) => host.status === '0').length
}

export function calculateActiveHostPercentage(hosts: ZabbixHost[]): number {
  if (hosts.length === 0) {
    return 0
  }

  return Math.round((countActiveHosts(hosts) / hosts.length) * 100)
}

export function getHostPrimaryIp(host: ZabbixHost): string {
  return host.interfaces?.find((item) => item.ip)?.ip ?? 'Sin IP'
}
