import type { MaintenanceType } from '../types/dashboard'

const maintenanceClassName: Record<MaintenanceType, string> = {
  Preventivo: 'badge badge-maintenance badge-maintenance-preventive',
  Predictivo: 'badge badge-maintenance badge-maintenance-predictive',
  Correctivo: 'badge badge-maintenance badge-maintenance-corrective',
}

interface MaintenanceBadgeProps {
  maintenanceType: MaintenanceType
}

export function MaintenanceBadge({ maintenanceType }: MaintenanceBadgeProps) {
  return (
    <span className={maintenanceClassName[maintenanceType]}>
      {maintenanceType}
    </span>
  )
}
