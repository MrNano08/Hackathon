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
  'No se pudo conectar con Zabbix. Verifique que la VPN esté conectada, que el token sea válido y que la URL de la API esté disponible.'

export const ZABBIX_DASHBOARD_CONNECTION_ERROR =
  'No se pudo conectar con Zabbix. Verifique que la VPN esté conectada, que el token sea válido y que el endpoint de Zabbix esté accesible.'

export const ZABBIX_EMPTY_TOKEN_ERROR =
  'Modo real activado, pero no existe VITE_ZABBIX_TOKEN. Pegue un token válido obtenido desde Zabbix.'

const DEFAULT_REFRESH_SECONDS = 15
const REQUEST_TIMEOUT_MS = 12000

const configuredMode: ZabbixMode =
  import.meta.env.VITE_ZABBIX_MODE?.toLowerCase() === 'real' ? 'real' : 'mock'

const zabbixApiUrl = import.meta.env.VITE_ZABBIX_API_URL?.trim() ?? ''
const zabbixToken = import.meta.env.VITE_ZABBIX_TOKEN?.trim() ?? ''
const useZabbixProxy = import.meta.env.VITE_USE_ZABBIX_PROXY === 'true'

const debugEnabled = import.meta.env.VITE_ZABBIX_DEBUG === 'true'

/**
 * Modos:
 * bearer => Authorization: Bearer TOKEN
 * raw    => Authorization: TOKEN
 * body   => "auth": "TOKEN" dentro del JSON-RPC
 * both   => Authorization: Bearer TOKEN + auth en body
 *
 * Nota:
 * Si VITE_USE_ZABBIX_PROXY=true, el header Authorization se inyecta desde vite.config.ts.
 */
const authMode =
  import.meta.env.VITE_ZABBIX_AUTH_MODE?.toLowerCase() || 'bearer'

export interface ZabbixDebugLog {
  id: number
  method: string
  params: Record<string, unknown>
  url: string
  authMode: string
  status?: number
  ok?: boolean
  requestBody: unknown
  responseBody?: unknown
  errorMessage?: string
  errorData?: string
  createdAt: string
}

interface ZabbixTriggerWithHosts {
  triggerid: string
  description?: string
  expression?: string
  priority?: string
  hosts?: Array<{
    hostid: string
    host?: string
    name?: string
  }>
}

const debugLogs: ZabbixDebugLog[] = []

function maskToken(value: string): string {
  if (!value) return ''
  if (value.length <= 12) return '***'
  return `${value.slice(0, 6)}...${value.slice(-6)}`
}

function addDebugLog(log: ZabbixDebugLog) {
  debugLogs.unshift(log)

  if (debugLogs.length > 20) {
    debugLogs.pop()
  }

  if (debugEnabled) {
    console.groupCollapsed(
      `%cZabbix Debug%c ${log.method}`,
      'color:#0f766e;font-weight:bold;',
      'color:inherit;',
    )
    console.log('URL:', log.url)
    console.log('Auth:', log.authMode)
    console.log('Request:', log.requestBody)
    console.log('Response:', log.responseBody)
    console.log('Error message:', log.errorMessage)
    console.log('Error data:', log.errorData)
    console.groupEnd()
  }
}

export function getZabbixDebugLogs(): ZabbixDebugLog[] {
  return [...debugLogs]
}

export function clearZabbixDebugLogs() {
  debugLogs.length = 0
}

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
    const hostid = Array.isArray(params.hostids)
      ? String(params.hostids[0] ?? '')
      : String(params.hostids ?? '')

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

function shouldSendAuthInBody() {
  return authMode === 'body' || authMode === 'both'
}

function shouldSendAuthInHeaderFromBrowser() {
  if (useZabbixProxy) {
    return false
  }

  return authMode === 'bearer' || authMode === 'raw' || authMode === 'both'
}

function buildZabbixRequestBody(
  method: string,
  params: Record<string, unknown>,
  id: number,
) {
  const body: Record<string, unknown> = {
    jsonrpc: '2.0',
    method,
    params,
    id,
  }

  if (shouldSendAuthInBody()) {
    body.auth = zabbixToken
  }

  return body
}

function buildHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (shouldSendAuthInHeaderFromBrowser()) {
    if (authMode === 'raw') {
      headers.Authorization = zabbixToken
    } else {
      headers.Authorization = `Bearer ${zabbixToken}`
    }
  }

  return headers
}

function sanitizeRequestForDebug(body: unknown) {
  if (!body || typeof body !== 'object') return body

  const copy = { ...(body as Record<string, unknown>) }

  if (typeof copy.auth === 'string') {
    copy.auth = maskToken(copy.auth)
  }

  return copy
}

function sanitizeHeadersForDebug(headers: Record<string, string>) {
  const copy = { ...headers }

  if (copy.Authorization) {
    if (copy.Authorization.startsWith('Bearer ')) {
      copy.Authorization = `Bearer ${maskToken(zabbixToken)}`
    } else {
      copy.Authorization = maskToken(zabbixToken)
    }
  }

  return copy
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

  const requestId = Date.now()
  const requestBody = buildZabbixRequestBody(method, params, requestId)
  const headers = buildHeaders()

  const debugBase: ZabbixDebugLog = {
    id: requestId,
    method,
    params,
    url: zabbixApiUrl,
    authMode: `${authMode} | proxy: ${
      useZabbixProxy ? 'ON' : 'OFF'
    } | browserHeaders: ${JSON.stringify(sanitizeHeadersForDebug(headers))}`,
    requestBody: sanitizeRequestForDebug(requestBody),
    createdAt: new Date().toISOString(),
  }

  try {
    const response = await fetch(zabbixApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    const rawText = await response.text()

    let payload: ZabbixApiResponse<T> | null = null

    try {
      payload = JSON.parse(rawText) as ZabbixApiResponse<T>
    } catch {
      addDebugLog({
        ...debugBase,
        status: response.status,
        ok: response.ok,
        responseBody: rawText,
        errorMessage: 'Zabbix no devolvió JSON válido.',
      })

      throw new Error(
        `Zabbix no devolvió JSON válido. HTTP ${response.status}. Respuesta: ${rawText.slice(
          0,
          300,
        )}`,
      )
    }

    if (!response.ok) {
      addDebugLog({
        ...debugBase,
        status: response.status,
        ok: response.ok,
        responseBody: payload,
        errorMessage: `HTTP ${response.status}`,
      })

      throw new Error(`${ZABBIX_CONNECTION_ERROR} HTTP ${response.status}.`)
    }

    if (!payload || payload.jsonrpc !== '2.0') {
      addDebugLog({
        ...debugBase,
        status: response.status,
        ok: response.ok,
        responseBody: payload,
        errorMessage: 'Respuesta inválida de Zabbix.',
      })

      throw new Error('Respuesta inválida de Zabbix.')
    }

    if (payload.error) {
      const errorMessage = payload.error.message || 'Error desconocido'
      const errorData = payload.error.data || ''

      addDebugLog({
        ...debugBase,
        status: response.status,
        ok: response.ok,
        responseBody: payload,
        errorMessage,
        errorData,
      })

      throw new Error(
        `Zabbix respondió con error en ${method}: ${errorMessage}${
          errorData ? ` | Detalle: ${errorData}` : ''
        }`,
      )
    }

    if (payload.result === undefined) {
      addDebugLog({
        ...debugBase,
        status: response.status,
        ok: response.ok,
        responseBody: payload,
        errorMessage: 'Respuesta inválida de Zabbix: result vacío.',
      })

      throw new Error('Respuesta inválida de Zabbix: result vacío.')
    }

    addDebugLog({
      ...debugBase,
      status: response.status,
      ok: response.ok,
      responseBody: payload,
    })

    return payload.result
  } catch (error) {
    const normalized = getRequestError(error)

    if (debugEnabled) {
      console.error('Zabbix request failed:', normalized)
    }

    throw normalized
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
      output: 'extend',
      selectInterfaces: 'extend',
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
      output: 'extend',
      selectInterfaces: 'extend',
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
      selectTags: 'extend',
      sortfield: 'eventid',
      sortorder: 'DESC',
      recent: true,
      limit: 50,
    },
    mode,
  )

  const triggerIds = Array.from(
    new Set(
      problems
        .map((problem) => String(problem.objectid ?? ''))
        .filter((objectid) => objectid.length > 0),
    ),
  )

  if (triggerIds.length === 0) {
    return normalizeProblems(problems)
  }

  try {
    const triggers = await fetchZabbix<ZabbixTriggerWithHosts[]>(
      'trigger.get',
      {
        output: ['triggerid', 'description', 'priority'],
        triggerids: triggerIds,
        selectHosts: ['hostid', 'host', 'name'],
      },
      mode,
    )

    const hostsByTriggerId = new Map(
      triggers.map((trigger) => [String(trigger.triggerid), trigger.hosts ?? []]),
    )

    const enrichedProblems = problems.map((problem) => {
      const triggerHosts = hostsByTriggerId.get(String(problem.objectid)) ?? []

      return {
        ...problem,
        hosts: triggerHosts,
      }
    }) as ZabbixProblem[]

    return normalizeProblems(enrichedProblems)
  } catch (error) {
    console.warn(
      'No se pudieron enriquecer los problemas con trigger.get. Se muestran problemas sin host asociado.',
      error,
    )

    return normalizeProblems(problems)
  }
}

export async function getItemsByHost(
  hostid: string,
  mode: ZabbixMode = configuredMode,
): Promise<ZabbixItem[]> {
  const items = await fetchZabbix<ZabbixItem[]>(
    'item.get',
    {
      output: 'extend',
      hostids: [hostid],
      sortfield: 'name',
      limit: 20,
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