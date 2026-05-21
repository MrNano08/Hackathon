interface LoadingStateProps {
  message?: string
}

export function LoadingState({
  message = 'Consultando datos de monitoreo...',
}: LoadingStateProps) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
