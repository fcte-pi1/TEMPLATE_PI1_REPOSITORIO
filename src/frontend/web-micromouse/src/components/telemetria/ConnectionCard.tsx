interface ConnectionCardProps {
  connected: boolean;
}

export function ConnectionCard({
  connected,
}: ConnectionCardProps) {
  return (
    <div className="telemetry-card">
      <span className="telemetry-label">
        Status da conexão
      </span>

      <div
        className={
          connected
            ? "connection-status connected"
            : "connection-status disconnected"
        }
      >
        <span className="status-dot" />

        <strong>
          {connected ? "Conectado" : "Desconectado"}
        </strong>
      </div>
    </div>
  );
}