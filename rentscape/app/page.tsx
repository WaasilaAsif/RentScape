import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-4xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 lg:p-12">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">RentScape</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Build rental experiences that feel premium from day one.</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Auth shells, role-based dashboards, and responsive navigation are ready. The backend can plug in data once the schema is complete.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Login
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                Signup
              </Link>
            </div>
          </div>
          <div className="rounded-4xl bg-slate-50 p-8">
            <div className="space-y-5">
              <div className="h-48 rounded-[1.75rem] bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Dashboard ready</p>
                <p className="mt-4 text-slate-700">Tenant and landlord shells, responsive sidebar, and card-based overview layouts are built.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Auth forms</p>
                  <p className="mt-2 text-sm text-slate-600">Validation, loading state, and role selection ready for integration.</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Skeleton UI</p>
                  <p className="mt-2 text-sm text-slate-600">Empty-state cards show the structure even before data arrives.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
