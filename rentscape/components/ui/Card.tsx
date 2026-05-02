import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, description, footer, className = "", children }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_rgb(59,130,246,0.08)] ${className}`}
      style={{ boxShadow: "0 1px 4px rgb(59 130 246 / 0.06), 0 0 0 1px rgb(226 232 240)" }}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
      )}
      {children && <div>{children}</div>}
      {footer && <div className="mt-5 pt-4 border-t border-slate-100">{footer}</div>}
    </div>
  );
}