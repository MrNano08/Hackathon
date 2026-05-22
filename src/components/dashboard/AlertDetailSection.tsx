import type { PrioritizedAlert } from '../../types/dashboard'
import { AlertDetailPanel } from '../AlertDetailPanel'

interface AlertDetailSectionProps {
  selectedAlert: PrioritizedAlert | undefined
}

export function AlertDetailSection({ selectedAlert }: AlertDetailSectionProps) {
  return (
    <section className="detail-section">
      <AlertDetailPanel alert={selectedAlert} />
    </section>
  )
}