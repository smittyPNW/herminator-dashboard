import { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export default function Card({ title, children, className = "", action, noPadding }: CardProps) {
  return (
    <div className={`synth-panel ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-[rgba(255,79,216,0.16)] px-5 py-3.5">
          <h2 className="card-title font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}
