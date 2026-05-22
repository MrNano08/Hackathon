import { useState } from 'react'
import type { PrioritizedAlert } from '../../types/dashboard'
import type { ZabbixProblem } from '../../types/zabbix'
import { PrioritizedAlertsTable } from '../PrioritizedAlertsTable'
import { RawEventsTable } from '../RawEventsTable'

type CompareMode = 'before' | 'after'

interface BeforeAfterAnalysisViewProps {
  problems: ZabbixProblem[]
  prioritizedAlerts: PrioritizedAlert[]
  selectedAlert: PrioritizedAlert | undefined
  onSelectAlert: (eventid: string) => void
}

export function BeforeAfterAnalysisView({
  problems,
  prioritizedAlerts,
  selectedAlert,
  onSelectAlert,
}: BeforeAfterAnalysisViewProps) {
  const [compareMode, setCompareMode] = useState<CompareMode>('before')

  const isBefore = compareMode === 'before'

  return (
    <section className="screen-card analysis-preview-card">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Comparador operativo</p>
          <h2>Antes y después del análisis</h2>
          <p>
            Cambia entre la vista original de Zabbix y la vista procesada por la
            lógica de priorización, usando el mismo espacio visual.
          </p>
        </div>

        <div
          className={`compare-toggle ${
            isBefore ? 'compare-toggle-before' : 'compare-toggle-after'
          }`}
          aria-label="Cambiar vista de análisis"
        >
          <button
            className={
              isBefore
                ? 'compare-button compare-button-active'
                : 'compare-button'
            }
            type="button"
            onClick={() => setCompareMode('before')}
          >
            Antes
          </button>

          <button
            className={
              !isBefore
                ? 'compare-button compare-button-active'
                : 'compare-button'
            }
            type="button"
            onClick={() => setCompareMode('after')}
          >
            Después
          </button>
        </div>
      </div>

      <div className="preview-frame">
        <div className="preview-toolbar">
          <div>
            <span
              className={
                isBefore
                  ? 'preview-dot before-dot'
                  : 'preview-dot after-dot'
              }
            />
            <strong>
              {isBefore
                ? 'Vista original de Zabbix'
                : 'Vista priorizada por IA'}
            </strong>
          </div>

          <p>
            {isBefore
              ? 'Datos técnicos sin interpretar'
              : 'Datos ordenados y explicados'}
          </p>
        </div>

        <div className="preview-copy">
          {isBefore ? (
            <p>
              Esta vista muestra los eventos tal como llegan desde Zabbix. Es
              útil para comprobar el dato original antes de aplicar
              interpretación, prioridad o recomendación técnica.
            </p>
          ) : (
            <p>
              Esta vista muestra el mismo conjunto de eventos después del
              análisis: prioridad calculada, categoría, explicación, recurrencia
              y acción inicial recomendada.
            </p>
          )}
        </div>

        <div className="preview-content">
          {isBefore ? (
            <RawEventsTable
              problems={problems}
              selectedEventId={selectedAlert?.eventid ?? null}
              onSelectProblem={onSelectAlert}
            />
          ) : (
            <PrioritizedAlertsTable
              alerts={prioritizedAlerts}
              selectedAlertId={selectedAlert?.eventid ?? null}
              onSelectAlert={onSelectAlert}
            />
          )}
        </div>
      </div>
    </section>
  )
}
