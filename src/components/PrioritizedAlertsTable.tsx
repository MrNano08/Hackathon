import type { PrioritizedAlert } from '../types/dashboard'
import { MaintenanceBadge } from './MaintenanceBadge'
import { PriorityBadge } from './PriorityBadge'

interface PrioritizedAlertsTableProps {
  alerts: PrioritizedAlert[]
  selectedAlertId: string | null
  onSelectAlert: (eventid: string) => void
}

export function PrioritizedAlertsTable({
  alerts,
  selectedAlertId,
  onSelectAlert,
}: PrioritizedAlertsTableProps) {
  return (
    <div className="table-scroll">
      <table className="data-table prioritized-table">
        <thead>
          <tr>
            <th>prioridad</th>
            <th>categoria</th>
            <th>problema</th>
            <th>recurrencia</th>
            <th>explicacion</th>
            <th>recomendacion</th>
            <th>tipo de mantenimiento</th>
          </tr>
        </thead>
        <tbody>
          {alerts.length === 0 ? (
            <tr>
              <td colSpan={7}>No hay alertas priorizadas para mostrar.</td>
            </tr>
          ) : (
            alerts.map((alert) => (
              <tr
                className={
                  selectedAlertId === alert.eventid ? 'selected-row' : ''
                }
                key={alert.eventid}
              >
                <td>
                  <PriorityBadge priority={alert.priority} />
                </td>
                <td>{alert.category}</td>
                <td>
                  <button
                    className="table-link"
                    type="button"
                    onClick={() => onSelectAlert(alert.eventid)}
                  >
                    {alert.name}
                  </button>
                </td>
                <td>
                  {alert.recurrenceCount > 1
                    ? `${alert.recurrenceCount} eventos`
                    : 'No recurrente'}
                </td>
                <td className="table-copy">{alert.explanation}</td>
                <td className="table-copy">{alert.recommendation}</td>
                <td>
                  <MaintenanceBadge maintenanceType={alert.maintenanceType} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
