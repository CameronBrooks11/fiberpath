import type { ReactNode } from "react";

interface ResultCardProps {
  title: string;
  children: ReactNode;
}

export function ResultCard({ title, children }: ResultCardProps) {
  return (
    <div className="result-card">
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}
