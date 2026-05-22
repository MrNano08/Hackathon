export type DashboardScreen =
  | 'resumen'
  | 'analisis'
  | 'visuales'
  | 'detalle'
  | 'metricas'
  | 'debug'

interface DashboardNavigationProps {
  activeScreen: DashboardScreen
  onChangeScreen: (screen: DashboardScreen) => void
  showDebug: boolean
}

const baseItems: Array<{
  id: DashboardScreen
  label: string
  description: string
}> = [
  {
    id: 'resumen',
    label: 'Resumen',
    description: 'Indicadores principales',
  },
  {
    id: 'analisis',
    label: 'Antes / Después',
    description: 'Comparador de análisis',
  },
  {
    id: 'detalle',
    label: 'Detalle',
    description: 'Alerta seleccionada',
  },
  {
    id: 'visuales',
    label: 'Visuales',
    description: 'Métricas gráficas',
  },
  {
    id: 'metricas',
    label: 'Métricas',
    description: 'Datos por host',
  },
]

export function DashboardNavigation({
  activeScreen,
  onChangeScreen,
  showDebug,
}: DashboardNavigationProps) {
  const items = showDebug
    ? [
        ...baseItems,

      ]
    : baseItems

  return (
    <nav className="dashboard-navigation" aria-label="Navegación del dashboard">
      {items.map((item) => (
        <button
          className={`nav-card ${
            activeScreen === item.id ? 'nav-card-active' : ''
          }`}
          key={item.id}
          type="button"
          aria-current={activeScreen === item.id ? 'page' : undefined}
          aria-pressed={activeScreen === item.id}
          onClick={() => onChangeScreen(item.id)}
        >
          <span>{item.label}</span>
          <small>{item.description}</small>
        </button>
      ))}
    </nav>
  )
}
