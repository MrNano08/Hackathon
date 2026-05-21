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
    <article
      style={{
        border: '1px solid #d1d5db',
        borderRadius: '14px',
        padding: '14px',
        background: '#ffffff',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <strong>{log.method}</strong>

          <p style={{ margin: '4px 0', color: '#475569' }}>
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>

        <span
          style={{
            fontWeight: 700,
            color: log.errorMessage ? '#b91c1c' : '#047857',
          }}
        >
          {log.errorMessage ? 'ERROR' : 'OK'}{' '}
          {log.status ? `HTTP ${log.status}` : ''}
        </span>
      </div>

      <div
        style={{
          marginTop: 8,
          padding: 10,
          borderRadius: 10,
          background: '#ecfeff',
          color: '#155e75',
          fontSize: 13,
          wordBreak: 'break-word',
        }}
      >
        <strong>Auth:</strong> {log.authMode}
      </div>

      {log.errorMessage ? (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 10,
            background: '#fef2f2',
            color: '#991b1b',
          }}
        >
          <strong>Mensaje:</strong> {log.errorMessage}

          {log.errorData ? (
            <>
              <br />
              <strong>Detalle:</strong> {log.errorData}
            </>
          ) : null}
        </div>
      ) : null}

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
          Ver request enviado a Zabbix
        </summary>

        <pre
          style={{
            overflowX: 'auto',
            background: '#0f172a',
            color: '#e5e7eb',
            padding: 12,
            borderRadius: 10,
            marginTop: 8,
            fontSize: 12,
          }}
        >
          {formatJson(log.requestBody)}
        </pre>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
          Ver respuesta de Zabbix
        </summary>

        <pre
          style={{
            overflowX: 'auto',
            background: '#0f172a',
            color: '#e5e7eb',
            padding: 12,
            borderRadius: 10,
            marginTop: 8,
            fontSize: 12,
          }}
        >
          {formatJson(log.responseBody)}
        </pre>
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
    <section
      style={{
        marginTop: 20,
        border: '1px solid #cbd5e1',
        borderRadius: 18,
        padding: 18,
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ margin: 0, color: '#0f766e', fontWeight: 800 }}>
            Debug real de Zabbix
          </p>

          <h2 style={{ margin: '4px 0' }}>Últimas llamadas JSON-RPC</h2>

          <p style={{ margin: 0, color: '#475569' }}>
            Sirve para ver exactamente qué método falló, qué request se envió y
            qué respondió Zabbix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
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
        <p style={{ color: '#475569' }}>
          Todavía no hay registros. Presione “Reintentar” para generar una
          llamada real.
        </p>
      ) : (
        logs.map((log) => <DebugLogCard key={`${log.id}-${log.method}`} log={log} />)
      )}
    </section>
  )
}