import type { PrioritizedAlert } from '../../types/dashboard'
import type { ZabbixHost, ZabbixMode, ZabbixProblem } from '../../types/zabbix'
import { SummaryCards } from '../SummaryCards'

interface OverviewScreenProps {
  hosts: ZabbixHost[]
  problems: ZabbixProblem[]
  alerts: PrioritizedAlert[]
  mode: ZabbixMode
}

export function OverviewScreen({
  hosts,
  problems,
  alerts,
  mode,
}: OverviewScreenProps) {
  return (
    <section className="screen-card overview-screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Resumen ejecutivo</p>
          <h2>Estado general del monitoreo</h2>
          <p>
            Indicadores principales para explicar rápidamente el estado actual,
            la cantidad de problemas activos y el nivel de prioridad detectado.
          </p>
        </div>
      </div>

      <SummaryCards
        hosts={hosts}
        problems={problems}
        alerts={alerts}
        mode={mode}
      />

      <div className="predictive-note embedded-note">
        <h2>Alcance del apoyo predictivo</h2>
        <p>
          El sistema identifica recurrencia, severidad y señales operativas para
          apoyar mantenimiento preventivo, predictivo y correctivo. No afirma
          una predicción exacta de fallas; organiza evidencia para acelerar la
          revisión.
        </p>
      </div>
    </section>
  )
}