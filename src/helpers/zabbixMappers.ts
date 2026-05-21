import type {
  ZabbixHost,
  ZabbixItem,
  ZabbixItemsByHost,
  ZabbixProblem,
} from '../types/zabbix'

const UNKNOWN_HOST = 'No disponible en problem.get'

export function normalizeHosts(hosts: ZabbixHost[]): ZabbixHost[] {
  return hosts.map((host) => ({
    hostid: String(host.hostid),
    name: host.name || 'Host sin nombre',
    status: String(host.status ?? '1'),
    interfaces: host.interfaces ?? [],
  }))
}

export function normalizeProblems(problems: ZabbixProblem[]): ZabbixProblem[] {
  return problems.map((problem, index) => ({
    eventid: String(problem.eventid || `evento-${index + 1}`),
    name: problem.name || 'Problema sin nombre',
    severity: String(problem.severity ?? '0'),
    clock: String(problem.clock || ''),
    opdata: problem.opdata || 'Sin datos operativos',
    acknowledged: String(problem.acknowledged ?? '0'),
    objectid: problem.objectid ? String(problem.objectid) : undefined,
    hostid: problem.hostid ? String(problem.hostid) : undefined,
    hostName: problem.hostName || problem.hosts?.[0]?.name,
    hosts: problem.hosts,
    tags: problem.tags,
  }))
}

export function normalizeItems(items: ZabbixItem[], hostid?: string): ZabbixItem[] {
  return items.map((item) => ({
    itemid: String(item.itemid),
    hostid: String(item.hostid ?? hostid ?? ''),
    name: item.name || 'Metrica sin nombre',
    key_: item.key_ || '',
    lastvalue: String(item.lastvalue ?? ''),
    units: item.units ?? '',
    lastclock: item.lastclock ? String(item.lastclock) : undefined,
  }))
}

export function normalizeItemsByHost(
  itemsByHost: ZabbixItemsByHost,
): ZabbixItemsByHost {
  return Object.fromEntries(
    Object.entries(itemsByHost).map(([hostid, items]) => [
      hostid,
      normalizeItems(items, hostid),
    ]),
  )
}

function findHostFromProblem(
  problem: ZabbixProblem,
  hosts: ZabbixHost[],
): ZabbixHost | undefined {
  if (problem.hostid) {
    return hosts.find((host) => host.hostid === problem.hostid)
  }

  const embeddedHost = problem.hosts?.[0]
  if (embeddedHost) {
    return hosts.find((host) => host.hostid === String(embeddedHost.hostid))
  }

  const hostTag = problem.tags?.find((tag) =>
    /host|equipo|device|node/i.test(tag.tag),
  )

  if (hostTag) {
    return hosts.find(
      (host) =>
        host.name.toLowerCase() === hostTag.value.toLowerCase() ||
        host.hostid === hostTag.value,
    )
  }

  const searchableText = `${problem.name} ${problem.opdata ?? ''}`.toLowerCase()
  return hosts.find((host) => searchableText.includes(host.name.toLowerCase()))
}

export function enrichProblemsWithHosts(
  problems: ZabbixProblem[],
  hosts: ZabbixHost[],
): ZabbixProblem[] {
  return problems.map((problem) => {
    const matchedHost = findHostFromProblem(problem, hosts)

    return {
      ...problem,
      hostid: matchedHost?.hostid ?? problem.hostid,
      hostName:
        matchedHost?.name ??
        problem.hostName ??
        problem.hosts?.[0]?.name ??
        UNKNOWN_HOST,
    }
  })
}
