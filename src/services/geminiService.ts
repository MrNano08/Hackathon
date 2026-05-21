import type { PrioritizedAlert } from '../types/dashboard'

interface GeminiPart {
  text?: string
}

interface GeminiContent {
  parts?: GeminiPart[]
}

interface GeminiCandidate {
  content?: GeminiContent
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[]
  error?: {
    message?: string
  }
}

interface GeminiAlertSuggestion {
  eventid: string
  explanation: string
  recommendation: string
  maintenanceType?: PrioritizedAlert['maintenanceType']
}

const GEMINI_TIMEOUT_MS = 15000
const MAX_ALERTS_FOR_GEMINI = 8

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? ''
const geminiModel =
  import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
const geminiEnabled = import.meta.env.VITE_GEMINI_ENABLED === 'true'

function getGeminiUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
}

function extractJsonArray(text: string): GeminiAlertSuggestion[] {
  const cleanText = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const start = cleanText.indexOf('[')
  const end = cleanText.lastIndexOf(']')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Gemini no devolvio un arreglo JSON valido.')
  }

  const parsed = JSON.parse(cleanText.slice(start, end + 1)) as unknown

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini no devolvio una lista de recomendaciones.')
  }

  return parsed
    .map((item) => item as Partial<GeminiAlertSuggestion>)
    .filter(
      (item): item is GeminiAlertSuggestion =>
        typeof item.eventid === 'string' &&
        typeof item.explanation === 'string' &&
        typeof item.recommendation === 'string',
    )
}

function buildGeminiPrompt(alerts: PrioritizedAlert[]): string {
  const compactAlerts = alerts.slice(0, MAX_ALERTS_FOR_GEMINI).map((alert) => ({
    eventid: alert.eventid,
    hostName: alert.hostName,
    name: alert.name,
    severity: alert.severity,
    priority: alert.priority,
    category: alert.category,
    maintenanceType: alert.maintenanceType,
    recurrenceCount: alert.recurrenceCount,
    score: alert.score,
    opdata: alert.opdata ?? '',
    matchedSignals: alert.matchedSignals,
    metrics: alert.relatedMetrics.slice(0, 5).map((metric) => ({
      name: metric.name,
      key: metric.key_,
      value: metric.lastvalue,
      units: metric.units ?? '',
    })),
  }))

  return `Actua como asistente tecnico de monitoreo de red para una hackathon. No inventes datos. Usa solo los eventos y metricas entregadas. Resume cada alerta en espanol claro, para personal tecnico.

Devuelve exclusivamente un arreglo JSON valido. No uses markdown. No agregues texto fuera del JSON.

Formato obligatorio:
[
  {
    "eventid": "id del evento",
    "explanation": "explicacion breve del posible problema sin afirmar causas no verificadas",
    "recommendation": "primera accion tecnica concreta para revisar",
    "maintenanceType": "Preventivo | Predictivo | Correctivo"
  }
]

Reglas:
- Maximo 35 palabras por explanation.
- Maximo 35 palabras por recommendation.
- Si hay caida, perdida total, unreachable, unavailable o severidad alta, usa Correctivo.
- Si hay recurrencia, tendencia o repeticion sin caida total, usa Predictivo.
- Si es advertencia de hardware, energia, temperatura o capacidad, usa Preventivo.

Alertas:
${JSON.stringify(compactAlerts, null, 2)}`
}

export function isGeminiConfigured(): boolean {
  return geminiEnabled && Boolean(geminiApiKey)
}

export async function enrichAlertsWithGemini(
  alerts: PrioritizedAlert[],
): Promise<PrioritizedAlert[]> {
  if (!isGeminiConfigured() || alerts.length === 0) {
    return alerts
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  try {
    const response = await fetch(getGeminiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildGeminiPrompt(alerts) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    })

    const payload = (await response.json()) as GeminiApiResponse

    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? `Gemini respondio HTTP ${response.status}`,
      )
    }

    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('') ?? ''
    const suggestions = extractJsonArray(text)
    const suggestionsByEventId = new Map(
      suggestions.map((suggestion) => [suggestion.eventid, suggestion]),
    )

    return alerts.map((alert) => {
      const suggestion = suggestionsByEventId.get(alert.eventid)

      if (!suggestion) {
        return alert
      }

      return {
        ...alert,
        explanation: suggestion.explanation || alert.explanation,
        recommendation: suggestion.recommendation || alert.recommendation,
        maintenanceType: suggestion.maintenanceType || alert.maintenanceType,
      }
    })
  } catch (error) {
    console.warn('Gemini no pudo enriquecer las alertas. Se usa clasificador local.', error)
    return alerts
  } finally {
    window.clearTimeout(timeoutId)
  }
}
