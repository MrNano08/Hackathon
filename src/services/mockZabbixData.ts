import type { ZabbixHost, ZabbixItem, ZabbixProblem } from '../types/zabbix'

const minutesAgo = (minutes: number) =>
  String(Math.floor(Date.now() / 1000) - minutes * 60)

export const mockHosts: ZabbixHost[] = [
  {
    hostid: '10084',
    name: 'Zabbix server',
    status: '0',
    interfaces: [{ ip: '127.0.0.1' }],
  },
  {
    hostid: '10654',
    name: 'CG-Controller',
    status: '0',
    interfaces: [{ ip: '192.0.2.15' }],
  },
  {
    hostid: '10661',
    name: 'PLANTA DC CMTL',
    status: '0',
    interfaces: [{ ip: '192.0.2.21' }],
  },
  {
    hostid: '10662',
    name: 'PLANTA DC STRT',
    status: '0',
    interfaces: [{ ip: '192.0.2.22' }],
  },
  {
    hostid: '10663',
    name: 'PLANTA HUACAS SUCURSAL',
    status: '0',
    interfaces: [{ ip: '192.0.2.23' }],
  },
  {
    hostid: '10701',
    name: 'CGR San Blas',
    status: '0',
    interfaces: [{ ip: '198.51.100.18' }],
  },
  {
    hostid: '10702',
    name: 'CGR Nicoya Florida',
    status: '0',
    interfaces: [{ ip: '198.51.100.25' }],
  },
  {
    hostid: '10703',
    name: 'CGR Playas del Coco',
    status: '1',
    interfaces: [{ ip: '198.51.100.31' }],
  },
]

export const mockProblems: ZabbixProblem[] = [
  {
    eventid: '910006',
    hostid: '10661',
    hostName: 'PLANTA DC CMTL',
    name: 'Cisco IOS: CGR1000 DC power supply: Power supply is in warning state',
    severity: '2',
    clock: minutesAgo(185),
    opdata: 'Current state: warning (2)',
    acknowledged: '0',
  },
  {
    eventid: '910005',
    hostid: '10661',
    hostName: 'PLANTA DC CMTL',
    name: 'Cisco IOS: CGR1000 DC power supply: Power supply is in warning state',
    severity: '2',
    clock: minutesAgo(120),
    opdata: 'Current state: warning (2)',
    acknowledged: '0',
  },
  {
    eventid: '910004',
    hostid: '10654',
    hostName: 'CG-Controller',
    name: 'ICMP loss is too high',
    severity: '4',
    clock: minutesAgo(92),
    opdata: 'Packet loss: 100%',
    acknowledged: '0',
  },
  {
    eventid: '910003',
    hostid: '10701',
    hostName: 'CGR San Blas',
    name: 'High CPU utilization',
    severity: '3',
    clock: minutesAgo(78),
    opdata: 'CPU usage above threshold',
    acknowledged: '1',
  },
  {
    eventid: '910002',
    hostid: '10703',
    hostName: 'CGR Playas del Coco',
    name: 'Interface link down',
    severity: '5',
    clock: minutesAgo(41),
    opdata: 'Operational status: down',
    acknowledged: '0',
  },
  {
    eventid: '910001',
    hostid: '10662',
    hostName: 'PLANTA DC STRT',
    name: 'Temperature warning',
    severity: '2',
    clock: minutesAgo(24),
    opdata: 'Current state: warning',
    acknowledged: '0',
  },
  {
    eventid: '910000',
    hostid: '10702',
    hostName: 'CGR Nicoya Florida',
    name: 'Memory usage is high',
    severity: '3',
    clock: minutesAgo(14),
    opdata: 'Memory usage above threshold',
    acknowledged: '0',
  },
  {
    eventid: '909999',
    hostid: '10654',
    hostName: 'CG-Controller',
    name: 'Unavailable by ICMP ping',
    severity: '4',
    clock: minutesAgo(8),
    opdata: 'ICMP loss = 100%',
    acknowledged: '0',
  },
]

export const mockItemsByHost: Record<string, ZabbixItem[]> = {
  '10654': [
    {
      itemid: '40001',
      hostid: '10654',
      name: 'ICMP loss',
      key_: 'icmppingloss',
      lastvalue: '100',
      units: '%',
    },
    {
      itemid: '40002',
      hostid: '10654',
      name: 'ICMP response time',
      key_: 'icmppingsec',
      lastvalue: '0',
      units: 's',
    },
  ],
  '10701': [
    {
      itemid: '40021',
      hostid: '10701',
      name: 'CPU utilization',
      key_: 'system.cpu.util',
      lastvalue: '91',
      units: '%',
    },
  ],
  '10702': [
    {
      itemid: '40031',
      hostid: '10702',
      name: 'Memory utilization',
      key_: 'vm.memory.util',
      lastvalue: '87',
      units: '%',
    },
  ],
  '10661': [
    {
      itemid: '40041',
      hostid: '10661',
      name: 'DC power supply status',
      key_: 'power.supply.status',
      lastvalue: '2',
      units: '',
    },
  ],
  '10662': [
    {
      itemid: '40051',
      hostid: '10662',
      name: 'Temperature',
      key_: 'sensor.temperature',
      lastvalue: '68',
      units: 'C',
    },
  ],
  '10703': [
    {
      itemid: '40061',
      hostid: '10703',
      name: 'Interface Gi0/1 operational status',
      key_: 'net.if.status[Gi0/1]',
      lastvalue: '2',
      units: '',
    },
  ],
}

export function getMockHosts(): Promise<ZabbixHost[]> {
  return Promise.resolve(mockHosts)
}

export function getMockProblems(): Promise<ZabbixProblem[]> {
  return Promise.resolve(mockProblems)
}

export function getMockItemsByHost(hostid: string): Promise<ZabbixItem[]> {
  return Promise.resolve(mockItemsByHost[hostid] ?? [])
}
