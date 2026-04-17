interface TopbarProps {
  title: string;
  subtitle: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
          {subtitle}
        </div>
      </div>
    </header>
  );
}
