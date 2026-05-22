import { useMemo, useState } from 'react'
import {
  clearZabbixDebugLogs,
  getZabbixDebugLogs,
  type ZabbixDebugLog,
} from '../services/zabbixService'

interface ZabbixDebugPanelProps {
  visible?: boolean
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function DebugLogCard({ log }: { log: ZabbixDebugLog }) {
  return (
    <article className="debug-log-card">
      <div className="debug-log-header">
        <div>
          <strong>{log.method}</strong>
          <p>{new Date(log.createdAt).toLocaleString('es-CR')}</p>
        </div>

        <span
          className={log.errorMessage ? 'debug-status-error' : 'debug-status-ok'}
        >
          {log.errorMessage ? 'ERROR' : 'OK'}{' '}
          {log.status ? `HTTP ${log.status}` : ''}
        </span>
      </div>

      <div className="debug-auth-box">
        <strong>Auth:</strong> {log.authMode}
      </div>

      {log.errorMessage ? (
        <div className="debug-error-box">
          <strong>Mensaje:</strong> {log.errorMessage}

          {log.errorData ? (
            <>
              <br />
              <strong>Detalle:</strong> {log.errorData}
            </>
          ) : null}
        </div>
      ) : null}

      <details className="debug-details">
        <summary>Ver request enviado a Zabbix</summary>
        <pre>{formatJson(log.requestBody)}</pre>
      </details>

      <details className="debug-details">
        <summary>Ver respuesta de Zabbix</summary>
        <pre>{formatJson(log.responseBody)}</pre>
      </details>
    </article>
  )
}

export function ZabbixDebugPanel({ visible = true }: ZabbixDebugPanelProps) {
  const [version, setVersion] = useState(0)

  const logs = useMemo(() => {
    version
    return getZabbixDebugLogs()
  }, [version])

  if (!visible) {
    return null
  }

  const handleRefreshLogs = () => {
    setVersion((current) => current + 1)
  }

  const handleClearLogs = () => {
    clearZabbixDebugLogs()
    setVersion((current) => current + 1)
  }

  return (
    <section className="debug-panel">
      <div className="debug-panel-header">
        <div>
          <p className="eyebrow">Debug real de Zabbix</p>
          <h2>Últimas llamadas JSON-RPC</h2>
          <p>
            Sirve para ver exactamente qué método falló, qué request se envió y
            qué respondió Zabbix.
          </p>
        </div>

        <div className="debug-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={handleRefreshLogs}
          >
            Actualizar debug
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={handleClearLogs}
          >
            Limpiar
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="debug-empty">
          Todavía no hay registros. Presione “Reintentar” para generar una
          llamada real.
        </p>
      ) : (
        logs.map((log) => (
          <DebugLogCard key={`${log.id}-${log.method}`} log={log} />
        ))
      )}
    </section>
  )
}