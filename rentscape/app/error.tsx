'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">RentScape</p>
        <h1 className="mt-3 text-3xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm text-blue-100/90">
          We could not load this page. Please try again, or return to a safe route.
        </p>
        {error?.message ? (
          <p className="mt-3 rounded-lg border border-white/20 bg-black/20 p-3 text-xs text-blue-100/90">
            {error.message}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  )
}