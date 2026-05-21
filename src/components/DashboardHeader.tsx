import type { ZabbixConnectionStatus, ZabbixMode } from '../types/zabbix'

interface DashboardHeaderProps {
  mode: ZabbixMode
  apiUrl: string
  loading: boolean
  error: string | null
  connectionStatus: ZabbixConnectionStatus
  refreshSeconds: number
  lastUpdated: Date | null
  onRefresh: () => void
}

const statusLabels: Record<ZabbixConnectionStatus, string> = {
  connected: 'Conectado a Zabbix',
  disconnected: 'VPN posiblemente desconectada',
  mock: 'Modo demo',
  loading: 'Cargando',
  error: 'Error de conexion',
}

export function DashboardHeader({
  mode,
  apiUrl,
  loading,
  error,
  connectionStatus,
  refreshSeconds,
  lastUpdated,
  onRefresh,
}: DashboardHeaderProps) {
  const isMockMode = mode === 'mock'

  return (
    <header className="dashboard-header">
      <div className="header-copy">
        <p className="eyebrow">Operacion de red - Zabbix real por VPN</p>
        <h1>Dashboard inteligente de priorizacion de alertas Zabbix</h1>
        <p className="header-subtitle">
          Convierte eventos tecnicos de Zabbix en prioridades, explicaciones y
          primeras acciones de mantenimiento.
        </p>
      </div>

      <div className="header-actions">
        <div
          className={`connection-status connection-status-${connectionStatus}`}
          title={apiUrl}
        >
          <span
            className={
              isMockMode
                ? 'status-dot status-demo'
                : `status-dot status-${connectionStatus}`
            }
            aria-hidden="true"
          />
          <div>
            <strong>{isMockMode ? 'Modo demo' : 'Modo real'}</strong>
            <span>{statusLabels[connectionStatus]}</span>
            <span>
              {isMockMode
                ? 'Datos simulados identificados como demo'
                : `Fuente: ${apiUrl}`}
            </span>
          </div>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Actualizar datos'}
        </button>

        <p className="last-updated">
          {lastUpdated
            ? `Ultima actualizacion: ${lastUpdated.toLocaleTimeString('es-CR', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Sin actualizacion reciente'}
        </p>

        <p className="last-updated">
          Actualizacion automatica cada {refreshSeconds} segundos
        </p>

        {error ? <p className="header-error">{error}</p> : null}
      </div>
    </header>
  )
}
