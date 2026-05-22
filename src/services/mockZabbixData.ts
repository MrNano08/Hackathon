import type { ZabbixHost, ZabbixItem, ZabbixProblem } from '../types/zabbix'

const minutesAgo = (minutes: number) =>
  String(Math.floor(Date.now() / 1000) - minutes * 60)

type DeviceProfile = {
  code: string
  label: string
  ipSegment: number
}

type CoopeLocation = {
  name: string
  canton: string
  area: 'Energía' | 'Telecomunicaciones' | 'Comercial' | 'Generación'
}

type GeneratedHost = {
  hostid: string
  name: string
  status: string
  ip: string
  location: CoopeLocation
  device: DeviceProfile
}

type DemoProblemScenario = {
  name: string
  severity: string
  opdata: string
}

const coopeLocations: CoopeLocation[] = [
  {
    name: 'Oficinas Centrales Santa Cruz',
    canton: 'Santa Cruz',
    area: 'Energía',
  },
  {
    name: 'Sucursal Santa Cruz',
    canton: 'Santa Cruz',
    area: 'Comercial',
  },
  {
    name: 'Sucursal Playas del Coco',
    canton: 'Carrillo',
    area: 'Comercial',
  },
  {
    name: 'Sucursal Filadelfia',
    canton: 'Carrillo',
    area: 'Comercial',
  },
  {
    name: 'Sucursal Nicoya',
    canton: 'Nicoya',
    area: 'Comercial',
  },
  {
    name: 'Sucursal San Martín',
    canton: 'Nicoya',
    area: 'Comercial',
  },
  {
    name: 'Sucursal Hojancha',
    canton: 'Hojancha',
    area: 'Comercial',
  },
  {
    name: 'Sucursal Carmona',
    canton: 'Nandayure',
    area: 'Comercial',
  },
  {
    name: 'Sucursal Jicaral',
    canton: 'Lepanto',
    area: 'Comercial',
  },
  {
    name: 'Sucursal Paquera',
    canton: 'Paquera',
    area: 'Comercial',
  },
  {
    name: 'Tienda Nosara',
    canton: 'Nosara',
    area: 'Comercial',
  },
  {
    name: 'ALSE Santa Cruz',
    canton: 'Santa Cruz',
    area: 'Comercial',
  },
  {
    name: 'Parque Solar Huacas',
    canton: 'Santa Cruz / Tamarindo',
    area: 'Generación',
  },
  {
    name: 'Telecom Fibra Santa Cruz',
    canton: 'Santa Cruz',
    area: 'Telecomunicaciones',
  },
  {
    name: 'Telecom IPTV Nicoya',
    canton: 'Nicoya',
    area: 'Telecomunicaciones',
  },
  {
    name: 'Telefonía IP Playas del Coco',
    canton: 'Carrillo',
    area: 'Telecomunicaciones',
  },
  {
    name: 'Centro de Operaciones Eléctricas',
    canton: 'Santa Cruz',
    area: 'Energía',
  },
  {
    name: 'Red Distribución Península',
    canton: 'Península de Nicoya',
    area: 'Energía',
  },
]

const deviceProfiles: DeviceProfile[] = [
  {
    code: 'RTR',
    label: 'Router principal',
    ipSegment: 10,
  },
  {
    code: 'SW',
    label: 'Switch de distribución',
    ipSegment: 20,
  },
  {
    code: 'OLT',
    label: 'Nodo de fibra óptica',
    ipSegment: 30,
  },
  {
    code: 'IPTV',
    label: 'Servicio IPTV',
    ipSegment: 40,
  },
  {
    code: 'VoIP',
    label: 'Telefonía IP',
    ipSegment: 50,
  },
]

const generatedHosts: GeneratedHost[] = coopeLocations.flatMap(
  (location, locationIndex) =>
    deviceProfiles.map((device, deviceIndex) => {
      const numericId = 20001 + locationIndex * deviceProfiles.length + deviceIndex

      return {
        hostid: String(numericId),
        name: `CG-${device.code}-${location.name}`,
        status: numericId % 23 === 0 ? '1' : '0',
        ip: `10.${20 + locationIndex}.${device.ipSegment}.${10 + deviceIndex}`,
        location,
        device,
      }
    }),
)

const preventiveDemoScenarios: DemoProblemScenario[] = [
  {
    name: 'Preventive power supply inspection',
    severity: '2',
    opdata: 'Voltaje estable, se recomienda revision preventiva de fuente y cableado',
  },
  {
    name: 'Temperature warning for preventive maintenance',
    severity: '2',
    opdata: 'Temperatura sobre rango ideal, sin caida del servicio',
  },
  {
    name: 'Fan speed preventive warning',
    severity: '2',
    opdata: 'Ventilador con variacion de RPM, requiere limpieza preventiva',
  },
  {
    name: 'Capacity preventive threshold warning',
    severity: '3',
    opdata: 'Capacidad cercana al umbral operativo, revisar crecimiento de uso',
  },
]

const predictiveDemoScenarios: DemoProblemScenario[] = [
  {
    name: 'Traffic pattern growth detected',
    severity: '3',
    opdata: 'Tendencia historica de trafico acumulado durante varias mediciones',
  },
  {
    name: 'Historic utilization trend rising',
    severity: '3',
    opdata: 'Patron repetido de consumo creciente sin interrupcion del servicio',
  },
  {
    name: 'Recurring latency pattern observed',
    severity: '2',
    opdata: 'Recurrencia moderada de latencia en horarios similares',
  },
]

function pickScenario(
  scenarios: DemoProblemScenario[],
  index: number,
): DemoProblemScenario {
  return scenarios[index % scenarios.length]
}

function getDemoMaintenanceScenario(
  host: GeneratedHost,
  index: number,
): DemoProblemScenario | null {
  const locationIndex = Math.floor(index / deviceProfiles.length)

  if (host.device.code === 'SW') {
    return pickScenario(preventiveDemoScenarios, locationIndex)
  }

  if (host.device.code === 'OLT') {
    if (locationIndex % 3 === 0) {
      return pickScenario(preventiveDemoScenarios, locationIndex + 1)
    }

    if (locationIndex % 3 === 2) {
      return pickScenario(predictiveDemoScenarios, locationIndex)
    }
  }

  if (host.device.code === 'IPTV') {
    if (locationIndex % 3 === 1) {
      return pickScenario(preventiveDemoScenarios, locationIndex + 2)
    }

    if (locationIndex % 3 === 0) {
      return pickScenario(predictiveDemoScenarios, locationIndex + 1)
    }
  }

  if (host.device.code === 'RTR' && locationIndex % 3 === 1) {
    return pickScenario(predictiveDemoScenarios, locationIndex + 2)
  }

  return null
}

export const mockHosts: ZabbixHost[] = generatedHosts.map((host) => ({
  hostid: host.hostid,
  name: host.name,
  status: host.status,
  interfaces: [{ ip: host.ip }],
}))

function getProblemForHost(host: GeneratedHost, index: number): ZabbixProblem {
  const eventid = String(910000 + (generatedHosts.length - index))
  const clock = minutesAgo(6 + ((index * 7) % 720))
  const acknowledged = index % 7 === 0 ? '1' : '0'
  const demoScenario = getDemoMaintenanceScenario(host, index)

  if (demoScenario) {
    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: `${demoScenario.name} - ${host.location.name}`,
      severity: demoScenario.severity,
      clock,
      opdata: demoScenario.opdata,
      acknowledged,
    }
  }

  if (host.location.name === 'Parque Solar Huacas') {
    const solarProblems = [
      {
        name: 'Inverter communication loss - Parque Solar Huacas',
        severity: '4',
        opdata: 'Inversor sin comunicación con SCADA',
      },
      {
        name: 'High inverter temperature - Parque Solar Huacas',
        severity: '3',
        opdata: `Temperatura de inversor: ${66 + (index % 12)} C`,
      },
      {
        name: 'Generation telemetry delay - Parque Solar Huacas',
        severity: '2',
        opdata: `Retraso de telemetría: ${4 + (index % 8)} min`,
      },
      {
        name: 'DC string current imbalance - Parque Solar Huacas',
        severity: '3',
        opdata: `Desbalance de corriente DC: ${12 + (index % 9)}%`,
      },
      {
        name: 'SCADA link latency - Parque Solar Huacas',
        severity: '2',
        opdata: `Latencia SCADA: ${180 + (index % 90)} ms`,
      },
    ]

    const selected = solarProblems[index % solarProblems.length]

    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: selected.name,
      severity: selected.severity,
      clock,
      opdata: selected.opdata,
      acknowledged,
    }
  }

  if (host.device.code === 'OLT') {
    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: `Low optical signal in fiber node - ${host.location.name}`,
      severity: index % 4 === 0 ? '4' : '3',
      clock,
      opdata: `Potencia óptica RX promedio: -${22 + (index % 8)} dBm`,
      acknowledged,
    }
  }

  if (host.device.code === 'IPTV') {
    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: `IPTV service degradation - ${host.location.name}`,
      severity: index % 5 === 0 ? '4' : '3',
      clock,
      opdata: `Canales IPTV con pérdida de paquetes: ${8 + (index % 20)}%`,
      acknowledged,
    }
  }

  if (host.device.code === 'VoIP') {
    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: `Telefonía IP jitter above threshold - ${host.location.name}`,
      severity: index % 6 === 0 ? '3' : '2',
      clock,
      opdata: `Jitter promedio en llamadas IP: ${18 + (index % 45)} ms`,
      acknowledged,
    }
  }

  if (host.device.code === 'RTR') {
    const isCritical = index % 9 === 0

    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: isCritical
        ? `Unavailable by ICMP ping - ${host.location.name}`
        : `ICMP loss is too high - ${host.location.name}`,
      severity: isCritical ? '5' : '4',
      clock,
      opdata: isCritical ? 'ICMP loss = 100%' : `Pérdida ICMP: ${35 + (index % 60)}%`,
      acknowledged,
    }
  }

  const switchProblem = index % 3

  if (switchProblem === 0) {
    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: `Interface uplink down - ${host.location.name}`,
      severity: '5',
      clock,
      opdata: 'Estado operativo del enlace: down',
      acknowledged,
    }
  }

  if (switchProblem === 1) {
    return {
      eventid,
      hostid: host.hostid,
      hostName: host.name,
      name: `High CPU utilization - ${host.location.name}`,
      severity: '3',
      clock,
      opdata: `CPU sobre umbral: ${82 + (index % 15)}%`,
      acknowledged,
    }
  }

  return {
    eventid,
    hostid: host.hostid,
    hostName: host.name,
    name: `Temperature warning - ${host.location.name}`,
    severity: '2',
    clock,
    opdata: `Temperatura actual: ${58 + (index % 18)} C`,
    acknowledged,
  }
}

export const mockProblems: ZabbixProblem[] = generatedHosts.map((host, index) =>
  getProblemForHost(host, index),
)

function buildItemsForHost(host: GeneratedHost, index: number): ZabbixItem[] {
  const baseItemId = 50000 + index * 10

  const baseItems: ZabbixItem[] = [
    {
      itemid: String(baseItemId + 1),
      hostid: host.hostid,
      name: 'ICMP availability',
      key_: 'icmpping',
      lastvalue: index % 13 === 0 ? '0' : '1',
      units: '',
    },
    {
      itemid: String(baseItemId + 2),
      hostid: host.hostid,
      name: 'ICMP response time',
      key_: 'icmppingsec',
      lastvalue: (0.012 + (index % 20) * 0.004).toFixed(3),
      units: 's',
    },
  ]

  if (host.device.code === 'RTR') {
    return [
      ...baseItems,
      {
        itemid: String(baseItemId + 3),
        hostid: host.hostid,
        name: 'CPU utilization',
        key_: 'system.cpu.util',
        lastvalue: String(45 + ((index * 3) % 52)),
        units: '%',
      },
      {
        itemid: String(baseItemId + 4),
        hostid: host.hostid,
        name: 'WAN bandwidth utilization',
        key_: 'net.if.util[wan]',
        lastvalue: String(50 + ((index * 5) % 49)),
        units: '%',
      },
    ]
  }

  if (host.device.code === 'SW') {
    return [
      ...baseItems,
      {
        itemid: String(baseItemId + 3),
        hostid: host.hostid,
        name: 'Uplink operational status',
        key_: 'net.if.status[uplink]',
        lastvalue: index % 17 === 0 ? '2' : '1',
        units: '',
      },
      {
        itemid: String(baseItemId + 4),
        hostid: host.hostid,
        name: 'Switch temperature',
        key_: 'sensor.temperature',
        lastvalue: String(42 + ((index * 2) % 35)),
        units: 'C',
      },
    ]
  }

  if (host.device.code === 'OLT') {
    return [
      ...baseItems,
      {
        itemid: String(baseItemId + 3),
        hostid: host.hostid,
        name: 'Optical RX power',
        key_: 'net.optical.rx',
        lastvalue: `-${18 + (index % 13)}`,
        units: 'dBm',
      },
      {
        itemid: String(baseItemId + 4),
        hostid: host.hostid,
        name: 'Active fiber clients',
        key_: 'olt.clients.active',
        lastvalue: String(80 + ((index * 7) % 520)),
        units: '',
      },
    ]
  }

  if (host.device.code === 'IPTV') {
    return [
      ...baseItems,
      {
        itemid: String(baseItemId + 3),
        hostid: host.hostid,
        name: 'IPTV multicast loss',
        key_: 'iptv.multicast.loss',
        lastvalue: String((index * 3) % 18),
        units: '%',
      },
      {
        itemid: String(baseItemId + 4),
        hostid: host.hostid,
        name: 'IPTV stream latency',
        key_: 'iptv.stream.latency',
        lastvalue: String(30 + ((index * 4) % 160)),
        units: 'ms',
      },
    ]
  }

  return [
    ...baseItems,
    {
      itemid: String(baseItemId + 3),
      hostid: host.hostid,
      name: 'VoIP jitter',
      key_: 'voip.jitter',
      lastvalue: String(5 + ((index * 2) % 55)),
      units: 'ms',
    },
    {
      itemid: String(baseItemId + 4),
      hostid: host.hostid,
      name: 'SIP registration failures',
      key_: 'voip.sip.failures',
      lastvalue: String(index % 9),
      units: '',
    },
  ]
}

export const mockItemsByHost: Record<string, ZabbixItem[]> =
  generatedHosts.reduce<Record<string, ZabbixItem[]>>((acc, host, index) => {
    acc[host.hostid] = buildItemsForHost(host, index)
    return acc
  }, {})

export function getMockHosts(): Promise<ZabbixHost[]> {
  return Promise.resolve(mockHosts)
}

export function getMockProblems(): Promise<ZabbixProblem[]> {
  return Promise.resolve(mockProblems)
}

export function getMockItemsByHost(hostid: string): Promise<ZabbixItem[]> {
  return Promise.resolve(mockItemsByHost[hostid] ?? [])
}
