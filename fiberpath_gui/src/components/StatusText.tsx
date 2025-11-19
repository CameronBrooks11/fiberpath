type StatusKind = "idle" | "running" | "success" | "error";

interface StatusTextProps {
  state: StatusKind;
  message?: string;
}

const statusLabel: Record<StatusKind, string> = {
  idle: "Idle",
  running: "Working…",
  success: "Done",
  error: "Error",
};

export function StatusText({ state, message }: StatusTextProps) {
  const className = ["status", state === "success" ? "ok" : undefined, state === "error" ? "error" : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <strong>{statusLabel[state]}</strong>
      {message ? ` – ${message}` : null}
    </div>
  );
}
