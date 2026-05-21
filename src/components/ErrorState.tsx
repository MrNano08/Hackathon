interface ErrorStateProps {
  message: string
  onRetry: () => void
  onUseDemo?: () => void
}

export function ErrorState({ message, onRetry, onUseDemo }: ErrorStateProps) {
  return (
    <section className="error-panel" aria-live="assertive">
      <div>
        <p className="eyebrow">Conexion Zabbix</p>
        <h2>No se pudo conectar con Zabbix</h2>
        <p>
          {message ||
            'No se pudo conectar con Zabbix. Verifique VPN, token, URL de API o posibles restricciones CORS.'}
        </p>
        <p className="error-hint">
          Puede reintentar el modo real o continuar la demostracion en{' '}
          <code>VITE_ZABBIX_MODE=mock</code>.
        </p>
      </div>
      <div className="error-actions">
        <button className="secondary-button" type="button" onClick={onRetry}>
          Reintentar
        </button>
        {onUseDemo ? (
          <button className="primary-button" type="button" onClick={onUseDemo}>
            Usar modo demo
          </button>
        ) : null}
      </div>
    </section>
  )
}
