import type { ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
}

export function Card({ title, description, footer, className = "" }: CardProps) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md ${className}`}>
      <div className="h-40 w-full rounded-3xl bg-slate-100" />
      <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      {footer ? <div className="mt-5">{footer}</div> : null}
    </div>
  );
}
