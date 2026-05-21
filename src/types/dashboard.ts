import type { ZabbixItem, ZabbixProblem } from './zabbix'

export type PriorityLevel = 'Alta' | 'Media' | 'Baja'

export type MaintenanceType = 'Preventivo' | 'Predictivo' | 'Correctivo'

export type AlertCategory =
  | 'Conectividad / Disponibilidad'
  | 'Rendimiento / Recursos'
  | 'Energ\u00eda / Hardware'
  | 'Temperatura / Ambiente'
  | 'Red / Interfaz'
  | 'General'

export interface PrioritizedAlert extends ZabbixProblem {
  hostName: string
  priority: PriorityLevel
  category: AlertCategory
  explanation: string
  recommendation: string
  maintenanceType: MaintenanceType
  score: number
  matchedSignals: string[]
  recurrenceCount: number
  statusLabel: string
  relatedMetrics: ZabbixItem[]
}
