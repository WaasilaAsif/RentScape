interface TopbarProps {
  title: string;
  subtitle: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-blue-100">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold text-white">{title}</h1>
        </div>
        <div className="rounded-xl bg-white/15 px-6 py-3 text-sm font-medium text-blue-50 backdrop-blur-sm border border-white/20">
          {subtitle}
        </div>
      </div>
    </header>
  );
}
