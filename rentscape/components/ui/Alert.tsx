interface AlertProps {
  title: string;
  description?: string;
  variant?: "error" | "info";
}

export function Alert({ title, description, variant = "error" }: AlertProps) {
  const accent = variant === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-sky-50 border-sky-200 text-sky-700";

  return (
    <div className={`rounded-2xl border p-4 ${accent}`}>
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm leading-6">{description}</p> : null}
    </div>
  );
}
