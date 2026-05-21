import { formatZabbixClock } from '../helpers/formatters'
import type { ZabbixProblem } from '../types/zabbix'

interface RawEventsTableProps {
  problems: ZabbixProblem[]
  selectedEventId: string | null
  onSelectProblem: (eventid: string) => void
}

export function RawEventsTable({
  problems,
  selectedEventId,
  onSelectProblem,
}: RawEventsTableProps) {
  return (
    <div className="table-scroll">
      <table className="data-table raw-table">
        <thead>
          <tr>
            <th>eventid</th>
            <th>name</th>
            <th>severity</th>
            <th>clock</th>
            <th>opdata</th>
            <th>acknowledged</th>
          </tr>
        </thead>
        <tbody>
          {problems.length === 0 ? (
            <tr>
              <td colSpan={6}>No hay eventos activos para mostrar.</td>
            </tr>
          ) : (
            problems.map((problem) => (
              <tr
                className={
                  selectedEventId === problem.eventid ? 'selected-row' : ''
                }
                key={problem.eventid}
              >
                <td>{problem.eventid}</td>
                <td>
                  <button
                    className="table-link"
                    type="button"
                    onClick={() => onSelectProblem(problem.eventid)}
                  >
                    {problem.name}
                  </button>
                </td>
                <td>{problem.severity}</td>
                <td>{formatZabbixClock(problem.clock)}</td>
                <td>{problem.opdata || 'Sin datos operativos'}</td>
                <td>{problem.acknowledged ?? '0'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
