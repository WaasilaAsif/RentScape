import type { ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, description, footer, className = "", children }: CardProps) {
  return (
    <div className={`rounded-2xl border border-blue-200/30 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg transition hover:shadow-xl hover:border-blue-300/50 ${className}`}>
      {children ? (
        <>
          <h3 className="text-lg font-semibold text-blue-900">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-blue-700/70">{description}</p> : null}
          <div className="mt-4">{children}</div>
          {footer ? <div className="mt-5">{footer}</div> : null}
        </>
      ) : (
        <>
          <div className="h-40 w-full rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100" />
          <h3 className="mt-5 text-lg font-semibold text-blue-900">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-6 text-blue-700/70">{description}</p> : null}
          {footer ? <div className="mt-5">{footer}</div> : null}
        </>
      )}
    </div>
  );
}
