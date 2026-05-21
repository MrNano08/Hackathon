import {
  normalizeHosts,
  normalizeItems,
  normalizeItemsByHost,
  normalizeProblems,
} from '../helpers/zabbixMappers'
import type {
  ZabbixApiResponse,
  ZabbixHost,
  ZabbixItem,
  ZabbixItemsByHost,
  ZabbixMode,
  ZabbixProblem,
} from '../types/zabbix'
import {
  getMockHosts,
  getMockItemsByHost,
  getMockProblems,
} from './mockZabbixData'

export const ZABBIX_REAL_ENDPOINT =
  'http://172.28.20.190/zabbix/api_jsonrpc.php'
export const ZABBIX_CONNECTION_ERROR =
  'No se pudo conectar con Zabbix. Verifique que la VPN Hackathon-UNA est\u00e9 conectada, que el token sea v\u00e1lido y que la URL de la API est\u00e9 disponible.'
export const ZABBIX_DASHBOARD_CONNECTION_ERROR =
  'No se pudo conectar con Zabbix. Verifique que la VPN Hackathon-UNA est\u00e9 conectada, que el token sea v\u00e1lido y que el endpoint http://172.28.20.190/zabbix/api_jsonrpc.php est\u00e9 accesible.'
export const ZABBIX_EMPTY_TOKEN_ERROR =
  'Modo real activado, pero no existe VITE_ZABBIX_TOKEN. Pegue un token v\u00e1lido obtenido desde user.login.'

const DEFAULT_REFRESH_SECONDS = 15
const REQUEST_TIMEOUT_MS = 12000
const configuredMode: ZabbixMode =
  import.meta.env.VITE_ZABBIX_MODE?.toLowerCase() === 'real' ? 'real' : 'mock'
const zabbixApiUrl = import.meta.env.VITE_ZABBIX_API_URL?.trim() ?? ''
const zabbixToken = import.meta.env.VITE_ZABBIX_TOKEN?.trim() ?? ''

function getMockResult<T>(
  method: string,
  params: Record<string, unknown>,
): Promise<T> {
  if (method === 'host.get') {
    return getMockHosts() as Promise<T>
  }

  if (method === 'problem.get') {
    return getMockProblems() as Promise<T>
  }

  if (method === 'item.get') {
    const hostid = String(params.hostids ?? '')
    return getMockItemsByHost(hostid) as Promise<T>
  }

  throw new Error(`Metodo mock no soportado: ${method}`)
}

function getRequestError(error: unknown): Error {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error(ZABBIX_CONNECTION_ERROR)
  }

  if (error instanceof TypeError) {
    return new Error(ZABBIX_CONNECTION_ERROR)
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('cors') ||
      message.includes('timeout')
    ) {
      return new Error(ZABBIX_CONNECTION_ERROR)
    }

    return error
  }

  return new Error(ZABBIX_CONNECTION_ERROR)
}

export function getZabbixMode(): ZabbixMode {
  return configuredMode
}

export function getZabbixApiUrl(): string {
  return zabbixApiUrl || 'URL de API no configurada'
}

export function getZabbixRefreshSeconds(): number {
  const configuredValue = Number(import.meta.env.VITE_ZABBIX_REFRESH_SECONDS)

  if (!Number.isFinite(configuredValue) || configuredValue <= 0) {
    return DEFAULT_REFRESH_SECONDS
  }

  return configuredValue
}

function assertRealModeConfig() {
  if (!zabbixToken) {
    throw new Error(ZABBIX_EMPTY_TOKEN_ERROR)
  }

  if (!zabbixApiUrl) {
    throw new Error(ZABBIX_CONNECTION_ERROR)
  }
}

export async function fetchZabbix<T>(
  method: string,
  params: Record<string, unknown>,
  mode: ZabbixMode = configuredMode,
): Promise<T> {
  if (mode === 'mock') {
    return getMockResult<T>(method, params)
  }

  assertRealModeConfig()

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(zabbixApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zabbixToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now(),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`${ZABBIX_CONNECTION_ERROR} HTTP ${response.status}.`)
    }

    const payload = (await response.json()) as ZabbixApiResponse<T>

    if (!payload || payload.jsonrpc !== '2.0') {
      throw new Error('Respuesta invalida de Zabbix.')
    }

    if (payload.error) {
      throw new Error(`Zabbix respondi\u00f3 con error: ${payload.error.message}`)
    }

    if (payload.result === undefined) {
      throw new Error('Respuesta invalida de Zabbix: result vacio.')
    }

    return payload.result
  } catch (error) {
    throw getRequestError(error)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function checkZabbixConnection(
  mode: ZabbixMode = configuredMode,
): Promise<boolean> {
  if (mode === 'mock') {
    return true
  }

  await fetchZabbix<ZabbixHost[]>(
    'host.get',
    {
      output: ['hostid'],
      limit: 1,
    },
    mode,
  )

  return true
}

export async function getHosts(
  mode: ZabbixMode = configuredMode,
): Promise<ZabbixHost[]> {
  const hosts = await fetchZabbix<ZabbixHost[]>(
    'host.get',
    {
      output: ['hostid', 'name', 'status'],
      selectInterfaces: ['ip'],
    },
    mode,
  )

  return normalizeHosts(hosts)
}

export async function getProblems(
  mode: ZabbixMode = configuredMode,
): Promise<ZabbixProblem[]> {
  const problems = await fetchZabbix<ZabbixProblem[]>(
    'problem.get',
    {
      output: 'extend',
      sortfield: ['eventid'],
      sortorder: 'DESC',
    },
    mode,
  )

  return normalizeProblems(problems)
}

export async function getItemsByHost(
  hostid: string,
  mode: ZabbixMode = configuredMode,
): Promise<ZabbixItem[]> {
  const items = await fetchZabbix<ZabbixItem[]>(
    'item.get',
    {
      output: ['itemid', 'name', 'key_', 'lastvalue', 'units'],
      hostids: hostid,
      sortfield: 'name',
    },
    mode,
  )

  return normalizeItems(items, hostid)
}

export async function getItemsForHosts(
  hosts: ZabbixHost[],
  mode: ZabbixMode = configuredMode,
): Promise<ZabbixItemsByHost> {
  const entries = await Promise.all(
    hosts.map(async (host) => {
      const items = await getItemsByHost(host.hostid, mode)
      return [host.hostid, items] as const
    }),
  )

  return normalizeItemsByHost(Object.fromEntries(entries))
}
