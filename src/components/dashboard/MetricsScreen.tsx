import { useMemo, useState } from 'react'
import type { ZabbixItem, ZabbixItemsByHost } from '../../types/zabbix'

type CompareMode = 'before' | 'after'
type MetricStatus = 'ok' | 'warning' | 'critical'

interface MetricsScreenProps {
  itemsByHost: ZabbixItemsByHost
}

interface InterpretedMetric {
  item: ZabbixItem
  group: string
  value: string
  status: MetricStatus
  statusLabel: string
  explanation: string
  recommendation: string
}

interface HostMetricSummary {
  hostId: string
  metrics: InterpretedMetric[]
  criticalCount: number
  warningCount: number
  okCount: number
  riskLabel: string
  mainAction: string
}

const statusWeight: Record<MetricStatus, number> = {
  critical: 3,
  warning: 2,
  ok: 1,
}

const statusClass: Record<MetricStatus, string> = {
  critical: 'badge badge-priority badge-priority-high',
  warning: 'badge badge-priority badge-priority-medium',
  ok: 'badge badge-priority badge-priority-low',
}

function normalizeText(value: string) {
  return value.toLowerCase().replaceAll('_', ' ')
}

function parseMetricValue(value: string) {
  const normalized = value.replace(',', '.').trim()
  const match = normalized.match(/-?\d+(\.\d+)?/)

  return match ? Number(match[0]) : Number.NaN
}

function formatMetricValue(metric: ZabbixItem) {
  const unit = metric.units ?? ''

  return `${metric.lastvalue}${unit}`
}

function getMetricGroup(metric: ZabbixItem) {
  const text = normalizeText(`${metric.name} ${metric.key_}`)

  if (text.includes('icmp') || text.includes('ping')) return 'Disponibilidad'
  if (text.includes('response') || text.includes('latency')) return 'Latencia'
  if (text.includes('cpu') || text.includes('util')) return 'Rendimiento'
  if (text.includes('status') || text.includes('uplink')) return 'Estado de enlace'
  if (text.includes('temperature') || text.includes('temperatura')) return 'Temperatura'
  if (text.includes('optical') || text.includes('rx') || text.includes('dbm')) return 'Fibra óptica'
  if (text.includes('iptv') || text.includes('multicast')) return 'IPTV'
  if (text.includes('voip') || text.includes('jitter') || text.includes('sip')) return 'Telefonía IP'
  if (text.includes('client')) return 'Clientes activos'

  return 'Métrica general'
}

function interpretMetric(metric: ZabbixItem): InterpretedMetric {
  const text = normalizeText(`${metric.name} ${metric.key_}`)
  const numericValue = parseMetricValue(metric.lastvalue)
  const value = formatMetricValue(metric)

  let status: MetricStatus = 'ok'
  let explanation = 'Métrica disponible para revisión operativa del host.'
  let recommendation = 'Usar como referencia junto con las alertas activas del equipo.'

  if (text.includes('icmpping') || text.includes('icmp availability')) {
    status = numericValue === 0 ? 'critical' : 'ok'

    explanation =
      numericValue === 0
        ? 'El host no responde a ICMP; puede existir caída o pérdida de conectividad.'
        : 'El host responde a ICMP; hay señal básica de disponibilidad.'

    recommendation =
      numericValue === 0
        ? 'Verificar energía, enlace físico, ruta y disponibilidad del equipo.'
        : 'Mantener observación y cruzar con latencia o pérdida de paquetes.'
  } else if (text.includes('icmppingsec') || text.includes('response time')) {
    if (numericValue >= 0.15) status = 'critical'
    else if (numericValue >= 0.08) status = 'warning'

    explanation =
      status === 'critical'
        ? 'El tiempo de respuesta es alto; puede afectar monitoreo y servicios dependientes.'
        : status === 'warning'
          ? 'El tiempo de respuesta está elevado y puede anticipar degradación.'
          : 'El tiempo de respuesta se mantiene dentro de un rango aceptable.'

    recommendation =
      status === 'ok'
        ? 'Continuar monitoreo normal.'
        : 'Revisar saturación, ruta, latencia WAN o pérdida intermitente.'
  } else if (text.includes('cpu') || text.includes('utilization')) {
    if (numericValue >= 90) status = 'critical'
    else if (numericValue >= 80) status = 'warning'

    explanation =
      status === 'critical'
        ? 'El uso de CPU está en nivel crítico y puede afectar la respuesta del equipo.'
        : status === 'warning'
          ? 'El uso de CPU está elevado; conviene revisar procesos o carga de tráfico.'
          : 'El uso de CPU no muestra presión relevante.'

    recommendation =
      status === 'ok'
        ? 'Mantener línea base para comparación histórica.'
        : 'Revisar procesos, tráfico anómalo, firmware o capacidad del equipo.'
  } else if (text.includes('bandwidth') || text.includes('net.if.util')) {
    if (numericValue >= 95) status = 'critical'
    else if (numericValue >= 85) status = 'warning'

    explanation =
      status === 'critical'
        ? 'La utilización del enlace está casi saturada; hay riesgo de pérdida o lentitud.'
        : status === 'warning'
          ? 'El enlace tiene alta utilización y puede degradarse en horas pico.'
          : 'La utilización del enlace se mantiene controlada.'

    recommendation =
      status === 'ok'
        ? 'Conservar monitoreo de tendencia.'
        : 'Validar consumo por interfaz, tráfico inusual y necesidad de ampliación.'
  } else if (text.includes('status') || text.includes('uplink')) {
    status = numericValue === 1 ? 'ok' : 'critical'

    explanation =
      status === 'critical'
        ? 'El estado operativo del enlace no es normal; puede existir enlace caído.'
        : 'El enlace reporta estado operativo normal.'

    recommendation =
      status === 'critical'
        ? 'Revisar puerto, cableado, transceptor, energía y equipo vecino.'
        : 'Mantener seguimiento de errores o cambios de estado.'
  } else if (text.includes('temperature') || text.includes('temperatura')) {
    if (numericValue >= 70) status = 'critical'
    else if (numericValue >= 60) status = 'warning'

    explanation =
      status === 'critical'
        ? 'La temperatura es crítica; puede provocar fallos o apagado preventivo.'
        : status === 'warning'
          ? 'La temperatura está elevada; puede anticipar falla ambiental o de ventilación.'
          : 'La temperatura se mantiene en un rango operativo razonable.'

    recommendation =
      status === 'ok'
        ? 'Mantener monitoreo ambiental.'
        : 'Revisar ventilación, polvo, cuarto técnico, fuente y ubicación del equipo.'
  } else if (
    text.includes('optical') ||
    text.includes('net.optical') ||
    text.includes('dbm')
  ) {
    if (numericValue <= -27) status = 'critical'
    else if (numericValue <= -23) status = 'warning'

    explanation =
      status === 'critical'
        ? 'La potencia óptica RX es muy baja; puede causar pérdida de servicio de fibra.'
        : status === 'warning'
          ? 'La potencia óptica RX está débil; conviene revisar antes de una caída.'
          : 'La potencia óptica RX no muestra deterioro crítico.'

    recommendation =
      status === 'ok'
        ? 'Mantener como referencia de línea óptica.'
        : 'Revisar conectores, empalmes, patch cord, atenuación y puerto óptico.'
  } else if (text.includes('multicast') || text.includes('loss')) {
    if (numericValue >= 10) status = 'critical'
    else if (numericValue >= 3) status = 'warning'

    explanation =
      status === 'critical'
        ? 'La pérdida multicast es alta; puede afectar la calidad del servicio IPTV.'
        : status === 'warning'
          ? 'Existe pérdida multicast moderada; puede generar cortes intermitentes.'
          : 'La pérdida multicast se mantiene baja.'

    recommendation =
      status === 'ok'
        ? 'Continuar monitoreo por canal o segmento.'
        : 'Validar red multicast, ancho de banda, errores de interfaz y equipos intermedios.'
  } else if (text.includes('stream latency') || text.includes('latency')) {
    if (numericValue >= 150) status = 'critical'
    else if (numericValue >= 80) status = 'warning'

    explanation =
      status === 'critical'
        ? 'La latencia del servicio está alta y puede afectar la experiencia del usuario.'
        : status === 'warning'
          ? 'La latencia está elevada; puede anticipar degradación del servicio.'
          : 'La latencia se mantiene en un rango aceptable.'

    recommendation =
      status === 'ok'
        ? 'Conservar monitoreo de tendencia.'
        : 'Revisar ruta, congestión, servidor origen y enlaces troncales.'
  } else if (text.includes('jitter')) {
    if (numericValue >= 30) status = 'critical'
    else if (numericValue >= 20) status = 'warning'

    explanation =
      status === 'critical'
        ? 'El jitter es crítico; puede afectar llamadas IP con cortes o mala calidad.'
        : status === 'warning'
          ? 'El jitter está elevado; puede provocar degradación de voz.'
          : 'El jitter se mantiene en valores aceptables.'

    recommendation =
      status === 'ok'
        ? 'Mantener monitoreo de calidad de voz.'
        : 'Revisar QoS, congestión, pérdida y estabilidad del enlace.'
  } else if (text.includes('sip') || text.includes('failures')) {
    if (numericValue >= 5) status = 'critical'
    else if (numericValue >= 1) status = 'warning'

    explanation =
      status === 'critical'
        ? 'Hay múltiples fallos SIP; puede existir problema de registro o servicio de telefonía.'
        : status === 'warning'
          ? 'Hay fallos SIP aislados; conviene revisar recurrencia.'
          : 'No se observan fallos SIP relevantes.'

    recommendation =
      status === 'ok'
        ? 'Mantener observación normal.'
        : 'Revisar credenciales, servidor SIP, conectividad y disponibilidad del servicio.'
  }

  return {
    item: metric,
    group: getMetricGroup(metric),
    value,
    status,
    statusLabel:
      status === 'critical'
        ? 'Crítica'
        : status === 'warning'
          ? 'Atención'
          : 'Normal',
    explanation,
    recommendation,
  }
}

function buildHostSummaries(itemsByHost: ZabbixItemsByHost): HostMetricSummary[] {
  return Object.entries(itemsByHost)
    .map(([hostId, metrics]) => {
      const interpretedMetrics = metrics
        .map(interpretMetric)
        .sort((a, b) => statusWeight[b.status] - statusWeight[a.status])

      const criticalCount = interpretedMetrics.filter(
        (metric) => metric.status === 'critical',
      ).length

      const warningCount = interpretedMetrics.filter(
        (metric) => metric.status === 'warning',
      ).length

      const okCount = interpretedMetrics.filter(
        (metric) => metric.status === 'ok',
      ).length

      const mostRelevantMetric = interpretedMetrics[0]

      const riskLabel =
        criticalCount > 0
          ? 'Riesgo alto'
          : warningCount > 0
            ? 'Requiere revisión'
            : 'Operación estable'

      return {
        hostId,
        metrics: interpretedMetrics,
        criticalCount,
        warningCount,
        okCount,
        riskLabel,
        mainAction:
          mostRelevantMetric?.recommendation ??
          'No hay métricas suficientes para generar una acción técnica.',
      }
    })
    .sort((a, b) => {
      const aScore = a.criticalCount * 3 + a.warningCount * 2
      const bScore = b.criticalCount * 3 + b.warningCount * 2

      return bScore - aScore
    })
}

export function MetricsScreen({ itemsByHost }: MetricsScreenProps) {
  const [compareMode, setCompareMode] = useState<CompareMode>('before')

  const hostEntries = Object.entries(itemsByHost)
  const hostSummaries = useMemo(() => buildHostSummaries(itemsByHost), [itemsByHost])

  const isBefore = compareMode === 'before'

  const totalMetrics = hostEntries.reduce(
    (total, [, metrics]) => total + metrics.length,
    0,
  )

  const criticalMetrics = hostSummaries.reduce(
    (total, host) => total + host.criticalCount,
    0,
  )

  const warningMetrics = hostSummaries.reduce(
    (total, host) => total + host.warningCount,
    0,
  )

  return (
    <section
      className="screen-card analysis-preview-card metrics-screen-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        maxHeight: 'calc(100vh - 120px)',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div className="screen-heading" style={{ flexShrink: 0 }}>
        <div>
          <p className="eyebrow">Métricas por host</p>
          <h2>Antes y después de interpretar item.get</h2>
          <p>
            La vista compara la métrica técnica original contra una lectura
            operativa pensada para que el técnico identifique más rápido qué
            revisar, por qué importa y cuál debería ser la primera acción.
          </p>
        </div>

        <div
          className={`compare-toggle ${
            isBefore ? 'compare-toggle-before' : 'compare-toggle-after'
          }`}
          aria-label="Cambiar vista de métricas"
        >
          <button
            className={
              isBefore ? 'compare-button compare-button-active' : 'compare-button'
            }
            type="button"
            onClick={() => setCompareMode('before')}
          >
            Antes
          </button>

          <button
            className={
              !isBefore ? 'compare-button compare-button-active' : 'compare-button'
            }
            type="button"
            onClick={() => setCompareMode('after')}
          >
            Después
          </button>
        </div>
      </div>

      <div
        className="metrics-scroll-container"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '0.4rem',
          paddingBottom: '3rem',
        }}
      >
        <div className="summary-grid embedded-note">
          <article className="summary-card">
            <span>Hosts analizados</span>
            <strong>{hostEntries.length}</strong>
            <p>Equipos con métricas consultadas desde item.get.</p>
          </article>

          <article className="summary-card">
            <span>Métricas leídas</span>
            <strong>{totalMetrics}</strong>
            <p>Valores técnicos disponibles para interpretación operativa.</p>
          </article>

          <article className="summary-card">
            <span>Críticas</span>
            <strong>{criticalMetrics}</strong>
            <p>Métricas que requieren atención prioritaria del técnico.</p>
          </article>

          <article className="summary-card">
            <span>En atención</span>
            <strong>{warningMetrics}</strong>
            <p>Métricas elevadas que podrían anticipar degradación.</p>
          </article>
        </div>

        {hostEntries.length === 0 ? (
          <div className="empty-state-box">
            No hay métricas cargadas todavía. Actualiza los datos o revisa la
            conexión con Zabbix.
          </div>
        ) : (
          <div
            className="preview-frame embedded-note"
            style={{
              overflow: 'visible',
            }}
          >
            <div className="preview-toolbar">
              <div>
                <span
                  className={
                    isBefore ? 'preview-dot before-dot' : 'preview-dot after-dot'
                  }
                />
                <strong>
                  {isBefore
                    ? 'Vista original de métricas Zabbix'
                    : 'Vista interpretada para soporte técnico'}
                </strong>
              </div>

              <p>
                {isBefore
                  ? 'Valores crudos: host, key, último valor y unidad'
                  : 'Lectura rápida: riesgo, causa probable y acción inicial'}
              </p>
            </div>

            <div className="preview-copy">
              {isBefore ? (
                <p>
                  Esta vista conserva la salida técnica de item.get. Sirve para
                  validar el dato original, pero exige que el técnico interprete
                  manualmente cada key, valor y unidad.
                </p>
              ) : (
                <p>
                  Esta vista convierte los valores en señales operativas. El
                  técnico puede priorizar hosts, detectar métricas críticas y
                  ejecutar una primera revisión sin leer cada dato crudo.
                </p>
              )}
            </div>

            <div
              className="preview-content metrics-preview-content"
              style={{
                height: 'auto',
                minHeight: 'unset',
                overflow: 'visible',
                padding: '18px',
              }}
            >
              {isBefore ? (
                <div
                  className="host-metrics-grid"
                  style={{
                    gridAutoRows: 'auto',
                    alignItems: 'start',
                    overflow: 'visible',
                  }}
                >
                  {hostEntries.map(([hostId, metrics]) => (
                    <article
                      className="host-metric-card"
                      key={hostId}
                      style={{
                        height: 'auto',
                        overflow: 'visible',
                      }}
                    >
                      <div className="host-metric-header">
                        <span>Host ID</span>
                        <strong>{hostId}</strong>
                      </div>

                      {metrics.length === 0 ? (
                        <p>No hay métricas disponibles para este host.</p>
                      ) : (
                        <div className="metric-list">
                          {metrics.map((metric) => (
                            <div className="metric-pill" key={metric.itemid}>
                              <span>{metric.name}</span>
                              <strong>{formatMetricValue(metric)}</strong>
                              <p>{metric.key_}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div
                  className="host-metrics-grid"
                  style={{
                    gridAutoRows: 'auto',
                    alignItems: 'start',
                    overflow: 'visible',
                  }}
                >
                  {hostSummaries.map((host) => (
                    <article
                      className="host-metric-card"
                      key={host.hostId}
                      style={{
                        height: 'auto',
                        overflow: 'visible',
                      }}
                    >
                      <div className="host-metric-header">
                        <span>{host.riskLabel}</span>
                        <strong>Host {host.hostId}</strong>
                      </div>

                      <div className="metric-list">
                        <div className="metric-pill">
                          <span>Críticas</span>
                          <strong>{host.criticalCount}</strong>
                        </div>

                        <div className="metric-pill">
                          <span>Atención</span>
                          <strong>{host.warningCount}</strong>
                        </div>

                        <div className="metric-pill">
                          <span>Normales</span>
                          <strong>{host.okCount}</strong>
                        </div>
                      </div>

                      <div className="raw-detail">
                        <h3>Primera acción sugerida</h3>
                        <p>{host.mainAction}</p>
                      </div>

                      <div className="metric-list embedded-note">
                        {host.metrics.map((metric) => (
                          <div className="metric-pill" key={metric.item.itemid}>
                            <span>{metric.group}</span>
                            <strong>{metric.value}</strong>
                            <p>{metric.explanation}</p>
                            <span className={statusClass[metric.status]}>
                              {metric.statusLabel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}