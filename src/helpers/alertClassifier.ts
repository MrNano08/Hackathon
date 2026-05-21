import { formatEventStatus } from './formatters'
import type {
  AlertCategory,
  MaintenanceType,
  PrioritizedAlert,
  PriorityLevel,
} from '../types/dashboard'
import type { ZabbixItemsByHost, ZabbixProblem } from '../types/zabbix'

const criticalSignals = [
  'link down',
  'interface down',
  'down',
  'unavailable',
  'failed',
  'failure',
  'loss',
  'critical',
  'high',
  'timeout',
  'unreachable',
]

const signalWeights = [
  { signal: 'link down', weight: 30 },
  { signal: 'interface down', weight: 30 },
  { signal: 'down', weight: 24 },
  { signal: 'unavailable', weight: 24 },
  { signal: 'failed', weight: 22 },
  { signal: 'failure', weight: 22 },
  { signal: 'loss', weight: 20 },
  { signal: 'critical', weight: 18 },
  { signal: 'unreachable', weight: 18 },
  { signal: 'timeout', weight: 16 },
  { signal: 'power supply', weight: 14 },
  { signal: 'temperature', weight: 14 },
  { signal: 'high', weight: 12 },
  { signal: 'warning', weight: 8 },
]

const RECURRENCE_THRESHOLD = 2

function getSeverityScore(severity: string): number {
  const severityNumber = Number(severity)

  if (severityNumber >= 5) {
    return 92
  }

  if (severityNumber === 4) {
    return 76
  }

  if (severityNumber === 3) {
    return 55
  }

  if (severityNumber === 2) {
    return 30
  }

  if (severityNumber === 1) {
    return 18
  }

  return 10
}

function getCategory(text: string): AlertCategory {
  if (/(power supply|hardware|fan|firmware|power|psu)/.test(text)) {
    return 'Energ\u00eda / Hardware'
  }

  if (/(icmp|ping|loss|unreachable|timeout)/.test(text)) {
    return 'Conectividad / Disponibilidad'
  }

  if (/(cpu|memory|disk|storage|filesystem|utilization|usage)/.test(text)) {
    return 'Rendimiento / Recursos'
  }

  if (/(temperature|heat|thermal)/.test(text)) {
    return 'Temperatura / Ambiente'
  }

  if (/(interface|link|port|ethernet|gi\d|fa\d|te\d)/.test(text)) {
    return 'Red / Interfaz'
  }

  return 'General'
}

function hasSevereIcmpLoss(text: string): boolean {
  return (
    /(icmp|ping)/.test(text) &&
    /loss/.test(text) &&
    /(100\s*%|=\s*100|:\s*100|packet loss:\s*100|loss is too high)/.test(text)
  )
}

function hasOutageSignal(text: string): boolean {
  return /(link down|interface down|down|unavailable|failed|failure|unreachable|timeout)/.test(
    text,
  )
}

function getPriority(
  severity: string,
  text: string,
  category: AlertCategory,
  recurrenceCount: number,
  severeIcmpLoss: boolean,
): PriorityLevel {
  const severityNumber = Number(severity)
  const hasCriticalSignal = criticalSignals.some((signal) =>
    text.includes(signal),
  )

  if (severeIcmpLoss || severityNumber >= 4 || hasOutageSignal(text)) {
    return 'Alta'
  }

  if (
    recurrenceCount >= RECURRENCE_THRESHOLD &&
    category === 'Energ\u00eda / Hardware' &&
    severityNumber <= 2
  ) {
    return 'Media'
  }

  if (severityNumber === 3 || hasCriticalSignal) {
    return 'Media'
  }

  return 'Baja'
}

function getMaintenanceType(
  text: string,
  category: AlertCategory,
  severity: string,
  recurrenceCount: number,
  severeIcmpLoss: boolean,
): MaintenanceType {
  const severityNumber = Number(severity)
  const hasFailure =
    severeIcmpLoss ||
    /(down|unavailable|failed|failure|unreachable|timeout|link down|interface down)/.test(
      text,
    ) ||
    /(total loss|packet loss:\s*100|loss\s*=\s*100)/.test(text)

  if (hasFailure || severityNumber >= 4) {
    return 'Correctivo'
  }

  if (
    category === 'Energ\u00eda / Hardware' ||
    category === 'Temperatura / Ambiente' ||
    /(warning|degrad|hardware|fan|power supply|temperature|capacity)/.test(text)
  ) {
    return 'Preventivo'
  }

  if (
    recurrenceCount > 1 ||
    /(recurr|repet|pattern|historic|trend|tendencia|acumul)/.test(text)
  ) {
    return 'Predictivo'
  }

  return 'Preventivo'
}

function buildExplanation(
  problem: ZabbixProblem,
  category: AlertCategory,
  maintenanceType: MaintenanceType,
  recurrenceCount: number,
  severeIcmpLoss: boolean,
): string {
  const text = `${problem.name} ${problem.opdata ?? ''}`.toLowerCase()

  if (
    recurrenceCount >= RECURRENCE_THRESHOLD &&
    category === 'Energ\u00eda / Hardware'
  ) {
    return 'El evento indica una advertencia recurrente en la fuente de poder del equipo. Aunque no representa una ca\u00edda total inmediata, la repetici\u00f3n puede indicar riesgo operativo asociado a energ\u00eda o hardware.'
  }

  if (severeIcmpLoss) {
    return 'El evento indica perdida total o severa de paquetes ICMP. Puede representar falta de respuesta del equipo, aislamiento de red o bloqueo en la ruta.'
  }

  if (category === 'Conectividad / Disponibilidad') {
    return 'La alerta apunta a conectividad o disponibilidad. Puede afectar la comunicacion con el equipo monitoreado y conviene revisar ruta, respuesta ICMP e interfaces.'
  }

  if (category === 'Energ\u00eda / Hardware') {
    return 'El equipo reporta una condicion de energia o hardware. Aunque no confirma caida total, puede representar degradacion operativa si no se atiende.'
  }

  if (category === 'Temperatura / Ambiente') {
    return 'La alerta indica una condicion termica fuera del comportamiento esperado. El riesgo es perdida de estabilidad si la temperatura sigue aumentando.'
  }

  if (category === 'Rendimiento / Recursos') {
    return 'La metrica supera un umbral operativo. Puede indicar saturacion de CPU, memoria o almacenamiento y ayuda a identificar riesgos sin afirmar prediccion exacta.'
  }

  if (category === 'Red / Interfaz') {
    return 'La alerta se relaciona con una interfaz, enlace o puerto. Si el estado persiste, puede afectar trafico operativo o disponibilidad del servicio.'
  }

  if (maintenanceType === 'Predictivo' || recurrenceCount > 1) {
    return 'El evento muestra recurrencia o acumulacion de senales similares. El sistema lo usa para apoyar la identificacion de riesgos operativos.'
  }

  if (text.includes('warning')) {
    return 'El evento esta en advertencia y puede empeorar si no se revisa. La primera revision debe confirmar estado fisico, tendencia historica e impacto.'
  }

  return 'El evento requiere revision tecnica para determinar impacto, recurrencia y accion inicial de mantenimiento.'
}

function buildRecommendation(
  category: AlertCategory,
  severeIcmpLoss: boolean,
  recurrenceCount: number,
): string {
  if (
    recurrenceCount >= RECURRENCE_THRESHOLD &&
    category === 'Energ\u00eda / Hardware'
  ) {
    return 'Revisar fuente de poder, voltaje de entrada, cableado, redundancia el\u00e9ctrica, estado f\u00edsico del equipo y comportamiento hist\u00f3rico del evento.'
  }

  if (severeIcmpLoss || category === 'Conectividad / Disponibilidad') {
    return 'Verificar conectividad, ruta de red, disponibilidad del equipo, firewall, latencia, perdida de paquetes y estado de interfaces.'
  }

  if (category === 'Energ\u00eda / Hardware') {
    return 'Validar fuente de poder, voltaje de entrada, cableado DC, redundancia electrica y estado fisico.'
  }

  if (category === 'Temperatura / Ambiente') {
    return 'Revisar ventilacion, temperatura del sitio, sensores, limpieza, carga del equipo y eventos historicos.'
  }

  if (category === 'Rendimiento / Recursos') {
    return 'Revisar CPU, memoria, almacenamiento, procesos activos, consumo historico y umbrales configurados.'
  }

  if (category === 'Red / Interfaz') {
    return 'Inspeccionar puerto, cableado, modulo, vecino conectado, errores de interfaz y cambios recientes.'
  }

  return 'Revisar el equipo afectado, validar logs historicos, confirmar recurrencia y documentar la accion aplicada.'
}

function getProblemSignature(problem: ZabbixProblem): string {
  return problem.name
    .toLowerCase()
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

function countBy<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
  return items.reduce((counts, item) => {
    const key = getKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
}

export function classifyAlerts(
  problems: ZabbixProblem[],
  itemsByHost: ZabbixItemsByHost = {},
): PrioritizedAlert[] {
  const signatureCounts = countBy(problems, getProblemSignature)

  return problems
    .map((problem) => {
      const relatedMetrics = problem.hostid ? itemsByHost[problem.hostid] ?? [] : []
      const metricsText = relatedMetrics
        .map(
          (metric) =>
            `${metric.name} ${metric.key_} ${metric.lastvalue}${metric.units ?? ''}`,
        )
        .join(' ')
        .toLowerCase()
      const fullText = `${problem.name} ${problem.opdata ?? ''} ${metricsText}`.toLowerCase()
      const matchedSignals = signalWeights
        .filter(({ signal }) => fullText.includes(signal))
        .map(({ signal }) => signal)
      const signalScore = signalWeights
        .filter(({ signal }) => fullText.includes(signal))
        .reduce((total, { weight }) => total + weight, 0)
      const category = getCategory(fullText)
      const recurrenceCount = signatureCounts.get(getProblemSignature(problem)) ?? 1
      const recurrenceBoost =
        recurrenceCount > 1 ? Math.min(20, recurrenceCount * 5) : 0
      const statusBoost = problem.acknowledged === '1' ? 0 : 6
      const severeIcmpLoss =
        hasSevereIcmpLoss(fullText) ||
        relatedMetrics.some((metric) => {
          const metricText = `${metric.name} ${metric.key_}`.toLowerCase()
          return (
            /(icmp|ping)/.test(metricText) &&
            /loss/.test(metricText) &&
            Number(metric.lastvalue) >= 80
          )
        })
      const score = Math.min(
        100,
        getSeverityScore(problem.severity) +
          signalScore +
          recurrenceBoost +
          statusBoost,
      )
      const priority = getPriority(
        problem.severity,
        fullText,
        category,
        recurrenceCount,
        severeIcmpLoss,
      )
      const maintenanceType = getMaintenanceType(
        fullText,
        category,
        problem.severity,
        recurrenceCount,
        severeIcmpLoss,
      )

      return {
        ...problem,
        hostName: problem.hostName ?? 'No disponible en problem.get',
        priority,
        category,
        explanation: buildExplanation(
          problem,
          category,
          maintenanceType,
          recurrenceCount,
          severeIcmpLoss,
        ),
        recommendation: buildRecommendation(
          category,
          severeIcmpLoss,
          recurrenceCount,
        ),
        maintenanceType,
        score,
        matchedSignals,
        recurrenceCount,
        statusLabel: formatEventStatus(problem.acknowledged),
        relatedMetrics,
      }
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityRank: Record<PriorityLevel, number> = {
          Alta: 3,
          Media: 2,
          Baja: 1,
        }

        return priorityRank[b.priority] - priorityRank[a.priority]
      }

      return b.score - a.score
    })
}
