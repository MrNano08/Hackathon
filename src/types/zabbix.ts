export type ZabbixMode = 'mock' | 'real'

export type ZabbixConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'mock'
  | 'loading'
  | 'error'

export interface ZabbixHostInterface {
  ip?: string
  dns?: string
  port?: string
  type?: string
  main?: string
  useip?: string
}

export interface ZabbixHost {
  hostid: string
  name: string
  status: string
  interfaces?: ZabbixHostInterface[]
}

export interface ZabbixProblemTag {
  tag: string
  value: string
}

export interface ZabbixProblemHost {
  hostid: string
  name: string
}

export interface ZabbixProblem {
  eventid: string
  name: string
  severity: string
  clock: string
  opdata?: string
  acknowledged?: string
  objectid?: string
  hostid?: string
  hostName?: string
  hosts?: ZabbixProblemHost[]
  tags?: ZabbixProblemTag[]
}

export interface ZabbixItem {
  itemid: string
  hostid?: string
  name: string
  key_: string
  lastvalue: string
  units?: string
  lastclock?: string
}

export type ZabbixItemsByHost = Record<string, ZabbixItem[]>

export interface ZabbixApiError {
  code: number
  message: string
  data?: string
}

export interface ZabbixApiResponse<T> {
  jsonrpc: '2.0'
  result?: T
  error?: ZabbixApiError
  id: number
}
