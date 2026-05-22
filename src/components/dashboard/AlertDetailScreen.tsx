import type { PrioritizedAlert } from '../../types/dashboard'
import { AlertDetailPanel } from '../AlertDetailPanel'

interface AlertDetailScreenProps {
  selectedAlert: PrioritizedAlert | undefined
}

export function AlertDetailScreen({ selectedAlert }: AlertDetailScreenProps) {
  return (
    <section className="screen-card detail-screen-card">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Detalle técnico</p>
          <h2>Alerta seleccionada</h2>
          <p>
            Muestra el evento seleccionado con explicación, recomendación
            inicial, datos originales y métricas relacionadas.
          </p>
        </div>
      </div>

      <AlertDetailPanel alert={selectedAlert} />
    </section>
  )
}