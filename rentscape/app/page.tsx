import Link from "next/link";

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes blob-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -15px) scale(1.05); }
          66%       { transform: translate(-10px, 10px) scale(0.97); }
        }
        .bg-anim {
          background: linear-gradient(-45deg, #071928, #0474C4, #06457F, #2C444C, #050f1a);
          background-size: 400% 400%;
          animation: gradient-shift 14s ease infinite;
        }
        .card-appear { animation: fade-up 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .blob { animation: blob-float 9s ease-in-out infinite; }
        .blob-2 { animation: blob-float 11s ease-in-out infinite reverse; animation-delay: -4s; }
      `}</style>

      <main className="bg-anim min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="blob absolute -top-24 -left-24 w-96 h-96 sm:w-[32rem] sm:h-[32rem] lg:w-[40rem] lg:h-[40rem] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="blob-2 absolute -bottom-24 -right-24 w-96 h-96 sm:w-[32rem] sm:h-[32rem] lg:w-[40rem] lg:h-[40rem] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="blob absolute top-1/2 left-1/3 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full bg-indigo-400/8 blur-3xl pointer-events-none" style={{ animationDelay: '-2s' }} />

        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl card-appear">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">RentScape</h1>
            <p className="text-blue-200/80 mt-1 text-sm sm:text-base">Login faster — launch rentals sooner</p>
          </div>

          {/* Card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(24px)', borderRadius: '24px' }}
            className="p-6 sm:p-8 shadow-2xl">

            <div className="space-y-4">
              <Link href="/login" className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-sky-500 hover:bg-sky-400">
                Sign In
              </Link>

              <Link href="/signup" className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 border border-white/20 bg-white/10 hover:bg-white/15">
                Create Account
              </Link>
            </div>

            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-center text-blue-200/70 text-sm">
                Tenant & Landlord Portal
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
