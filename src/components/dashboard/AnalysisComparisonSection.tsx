import type { PrioritizedAlert } from '../../types/dashboard'
import type { ZabbixProblem } from '../../types/zabbix'
import { PrioritizedAlertsTable } from '../PrioritizedAlertsTable'
import { RawEventsTable } from '../RawEventsTable'
import { SectionHeader } from './SectionHeader'

interface AnalysisComparisonSectionProps {
  problems: ZabbixProblem[]
  prioritizedAlerts: PrioritizedAlert[]
  selectedAlert: PrioritizedAlert | undefined
  onSelectAlert: (eventid: string) => void
}

export function AnalysisComparisonSection({
  problems,
  prioritizedAlerts,
  selectedAlert,
  onSelectAlert,
}: AnalysisComparisonSectionProps) {
  return (
    <section className="comparison-section">
      <SectionHeader
        eyebrow="Análisis operativo"
        title="Antes y después del análisis"
        description="Comparación directa entre el dato técnico original y la interpretación priorizada."
      />

      <div className="comparison-grid">
        <section className="analysis-block">
          <div className="block-heading">
            <span>ANTES</span>
            <h3>Eventos técnicos sin priorizar</h3>
          </div>

          <p>
            Información original obtenida desde Zabbix mediante problem.get. Se
            muestra sin interpretación adicional para evidenciar el punto de
            partida técnico.
          </p>

          <RawEventsTable
            problems={problems}
            selectedEventId={selectedAlert?.eventid ?? null}
            onSelectProblem={onSelectAlert}
          />
        </section>

        <section className="analysis-block analysis-block-strong">
          <div className="block-heading">
            <span>DESPUÉS</span>
            <h3>Alertas priorizadas y explicadas</h3>
          </div>

          <p>
            Los mismos eventos se ordenan por prioridad y se enriquecen con
            categoría, explicación, mantenimiento sugerido y primera acción
            recomendada.
          </p>

          <PrioritizedAlertsTable
            alerts={prioritizedAlerts}
            selectedAlertId={selectedAlert?.eventid ?? null}
            onSelectAlert={onSelectAlert}
          />
        </section>
      </div>
    </section>
  )
}