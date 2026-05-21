import type { PriorityLevel } from '../types/dashboard'

const priorityClassName: Record<PriorityLevel, string> = {
  Alta: 'badge badge-priority badge-priority-high',
  Media: 'badge badge-priority badge-priority-medium',
  Baja: 'badge badge-priority badge-priority-low',
}

interface PriorityBadgeProps {
  priority: PriorityLevel
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <span className={priorityClassName[priority]}>{priority}</span>
}
