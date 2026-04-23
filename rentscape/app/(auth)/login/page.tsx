'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Montserrat, Playfair_Display } from 'next/font/google'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
})

type Role = 'tenant' | 'landlord'
export default function AdminAuthSlider() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  const supabase =
    supabaseUrl && supabaseAnonKey
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : null
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    role: 'tenant' as Role,
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })



  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError('Supabase client is not configured. Please check frontend environment variables.')
      return
    }
    const email = loginForm.email.trim()
    const password = loginForm.password

    if (!email || !password) {
      setError('Please complete all fields.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      setError(userError?.message ?? 'User session was not initialized. Please sign in again.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setLoading(false)
    router.push(profile?.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard')
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError('Supabase client is not configured. Please check frontend environment variables.')
      return
    }

    if (signupForm.password !== signupForm.confirm_password) {
      setError('Passwords do not match.')
      return
    }

    if (signupForm.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email: signupForm.email.trim(),
      password: signupForm.password,
      options: {
        data: {
          full_name: signupForm.full_name.trim(),
          role: signupForm.role,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push(signupForm.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard')
  }

  return (
    <main
      className={`${montserrat.className} ${playfair.variable} auth-page-root relative isolate flex min-h-screen w-full min-w-0 shrink-0 flex-col text-white`}
    >
      <style>{`
        :root {
          color-scheme: dark;
        }

        /* Matches app/(dashboard)/layout.tsx bg-anim — same palette as the dashboard shell */
        @keyframes auth-gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .auth-page-root {
          min-height: 100dvh;
          min-height: 100svh;
          background: linear-gradient(-45deg, #071928, #0474c4, #06457f, #2c444c, #050f1a);
          background-size: 400% 400%;
          animation: auth-gradient-shift 14s ease infinite;
        }

        /* In-flow sizer: children are all position:absolute; without this the shell collapses to a thin strip in flex layouts. */
        .auth-shell-sizer {
          position: relative;
          z-index: 0;
          display: block;
          width: 100%;
          max-width: none;
          min-height: 100vh;
          min-height: 100dvh;
          pointer-events: none;
          visibility: hidden;
        }

        .auth-shell {
          --split-wide: 60%;
          --split-narrow: 40%;
          position: relative;
          width: 100%;
          max-width: none;
          margin-left: auto;
          margin-right: auto;
          min-height: 100vh;
          min-height: 100dvh;
          border-radius: 0;
          overflow: hidden;
          background: rgba(5, 15, 26, 0.35);
          border: none;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 0 80px rgba(4, 116, 196, 0.06);
          backdrop-filter: blur(20px);
          font-feature-settings: 'kern' 1;
          letter-spacing: 0.02em;
        }

        .auth-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse 90% 70% at 0% 0%, rgba(4, 116, 196, 0.22), transparent 45%),
            radial-gradient(ellipse 80% 60% at 100% 100%, rgba(79, 70, 229, 0.14), transparent 42%);
          pointer-events: none;
        }

        .auth-shell::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          box-shadow: none;
          pointer-events: none;
        }

        .display-serif {
          font-family: var(--font-playfair), Georgia, serif;
        }

        .panel-title {
          position: absolute;
          top: clamp(16px, 3vh, 28px);
          left: clamp(20px, 4vw, 40px);
          z-index: 5;
          max-width: min(240px, 40vw);
          font-size: 0.85rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(248, 250, 252, 0.78);
          pointer-events: none;
        }

        .auth-shell.right-panel-active .sign-in-container {
          transform: translateX(-100%);
          opacity: 0;
          z-index: 1;
        }

        .auth-shell.right-panel-active .sign-up-container {
          transform: translateX(0);
          opacity: 1;
          z-index: 5;
        }

        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(24px, 5vh, 56px) clamp(18px, 3vw, 40px);
          overflow-x: hidden;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
          transition: transform 0.6s ease-in-out, opacity 0.6s ease-in-out;
        }

        .sign-in-container,
        .sign-up-container {
          position: absolute;
          top: 0;
          height: 100%;
          overflow-y: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(56px, 8vh, 96px) clamp(18px, 3vw, 40px);
          box-sizing: border-box;
        }

        .sign-in-container {
          left: 0;
          width: var(--split-wide);
          z-index: 2;
        }

        .sign-up-container {
          left: var(--split-narrow);
          width: var(--split-wide);
          min-width: 0;
          opacity: 0;
          transform: translateX(100%);
          z-index: 1;
          align-items: flex-start;
          padding-top: clamp(32px, 5vh, 56px);
        }

        .form-card {
          width: 100%;
          max-width: min(520px, 100%);
          background: rgba(7, 25, 40, 0.72);
          border: 1px solid rgba(147, 197, 253, 0.18);
          border-radius: 32px;
          padding: 54px 48px;
          backdrop-filter: blur(20px);
          box-shadow: 0 30px 80px rgba(5, 15, 35, 0.45);
        }

        .form-card h1 {
          font-size: clamp(1.85rem, 2.2vw, 2.45rem);
          font-weight: 700;
          line-height: 1.06;
          letter-spacing: 0.02em;
          margin-bottom: 12px;
          color: #fbf8f6;
        }

        .form-card p {
          margin-bottom: 28px;
          color: rgba(226, 232, 240, 0.72);
          line-height: 1.8;
        }

        .input-field {
          width: 100%;
          margin-bottom: 18px;
        }

        .control-label {
          display: block;
          margin-bottom: 10px;
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          color: rgba(226, 232, 240, 0.66);
          text-transform: uppercase;
        }

        .input {
          width: 100%;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #f8fafc;
          padding: 16px 18px;
          font-size: 0.98rem;
          transition: border-color 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
        }

        .input:focus {
          outline: none;
          border-color: rgba(96, 165, 250, 0.95);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.22);
          background: rgba(255,255,255,0.12);
        }

        .button {
          width: 100%;
          padding: 16px 0;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }

        .button.primary {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: #f8fafc;
          box-shadow: 0 18px 44px rgba(37, 99, 235, 0.35);
        }

        .button.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 22px 52px rgba(79, 70, 229, 0.38);
        }

        .cta-center {
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
          display: block;
        }

        .button.ghost {
          background: transparent;
          color: #f8fafc;
          border: 2px solid rgba(255,255,255,0.7);
          max-width: 240px;
          margin-top: 16px;
        }

        .button.ghost:hover {
          background: rgba(255,255,255,0.08);
          transform: translateY(-1px);
        }

        .small-text {
          margin-top: 22px;
          font-size: 0.92rem;
          line-height: 1.6;
          color: rgba(226, 232, 240, 0.68);
          text-align: center;
        }

        .error-box {
          background: rgba(248, 113, 113, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.3);
          color: #fecaca;
          padding: 14px 16px;
          border-radius: 16px;
          margin-bottom: 20px;
          font-size: 0.94rem;
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: var(--split-wide);
          width: var(--split-narrow);
          height: 100%;
          overflow: hidden;
          transition: transform 0.65s cubic-bezier(0.65, 0, 0.35, 1);
          z-index: 0;
        }

        /* Move by full "wide" band in parent space: (-wide/narrow)*100% of this element's width */
        .auth-shell.right-panel-active .overlay-container {
          transform: translateX(calc(-100% * 60 / 40));
        }

        .overlay {
          background:
            linear-gradient(155deg, rgba(255, 255, 255, 0.07) 0%, transparent 48%),
            linear-gradient(135deg, #050f1a 0%, #071928 28%, #06457f 58%, #0474c4 92%);
          background-repeat: no-repeat;
          background-size: cover;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.65s cubic-bezier(0.65, 0, 0.35, 1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 32px 80px rgba(5, 15, 35, 0.45);
        }

        .overlay::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(
            115deg,
            transparent 18%,
            rgba(56, 189, 248, 0.14) 50%,
            transparent 78%
          );
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .auth-shell.right-panel-active .overlay {
          transform: translateX(50%);
        }

        .overlay-panel {
          position: relative;
          z-index: 1;
          width: 50%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: clamp(72px, 12vh, 110px) clamp(28px, 4vw, 44px);
          color: #ffffff;
          box-sizing: border-box;
        }

        .overlay-panel h2 {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(1.85rem, 2.5vw, 2.35rem);
          font-weight: 700;
          margin-bottom: 18px;
          line-height: 1.12;
          letter-spacing: 0.02em;
          transition: opacity 0.55s ease 0.42s, transform 0.55s ease 0.42s;
        }

        .overlay-panel p {
          font-size: 0.98rem;
          line-height: 1.85;
          margin-bottom: 32px;
          max-width: 320px;
          color: rgba(255,255,255,0.9);
          transition: opacity 0.55s ease 0.5s, transform 0.55s ease 0.5s;
        }

        .overlay-panel span {
          display: block;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.28em;
          color: rgba(255,255,255,0.82);
          font-size: 0.72rem;
          font-weight: 600;
          transition: opacity 0.55s ease 0.34s, transform 0.55s ease 0.34s;
        }

        .overlay-panel .overlay-button {
          transition:
            opacity 0.55s ease 0.58s,
            transform 0.55s ease 0.58s,
            background 0.25s ease,
            box-shadow 0.25s ease;
        }

        .overlay-panel-right {
          align-items: flex-end;
          text-align: right;
        }

        .overlay-panel-left {
          align-items: flex-start;
          text-align: left;
        }

        .overlay-button {
          outline: none;
          border: 2px solid rgba(255,255,255,0.85);
          background: transparent;
          color: #ffffff;
          font-weight: 700;
          letter-spacing: 0.12em;
          border-radius: 18px;
          padding: 16px 28px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .overlay-button:hover {
          background: rgba(255,255,255,0.18);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
        }

        .mobile-auth-switch {
          display: none;
        }

        .overlay-panel span,
        .overlay-panel h2,
        .overlay-panel p,
        .overlay-panel .overlay-button {
          opacity: 0;
          transform: translateY(16px);
        }

        .auth-shell:not(.right-panel-active) .overlay-panel-right span,
        .auth-shell:not(.right-panel-active) .overlay-panel-right h2,
        .auth-shell:not(.right-panel-active) .overlay-panel-right p,
        .auth-shell:not(.right-panel-active) .overlay-panel-right .overlay-button {
          opacity: 1;
          transform: translateY(0);
        }

        .auth-shell.right-panel-active .overlay-panel-left span,
        .auth-shell.right-panel-active .overlay-panel-left h2,
        .auth-shell.right-panel-active .overlay-panel-left p,
        .auth-shell.right-panel-active .overlay-panel-left .overlay-button {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 920px) {
          .auth-shell {
            width: 100%;
            max-width: none;
            min-height: auto;
            padding-bottom: 8px;
          }
          .panel-title {
            position: static;
            text-align: center;
            margin: 20px 20px 0;
          }
          .mobile-auth-switch {
            display: flex;
            position: relative;
            z-index: 20;
            margin: 20px 20px 0;
            padding: 4px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }
          .mobile-auth-switch button {
            flex: 1;
            border: none;
            cursor: pointer;
            padding: 12px 14px;
            border-radius: 999px;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(226, 232, 240, 0.72);
            background: transparent;
            transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
          }
          .mobile-auth-switch button.active {
            color: #f8fafc;
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            box-shadow: 0 14px 28px rgba(37, 99, 235, 0.35);
          }
          .form-container,
          .overlay-panel {
            padding: 28px 22px 36px;
          }
          .overlay-container {
            display: none;
          }
          .form-container {
            width: 100%;
            position: relative;
            top: 0;
            left: 0;
            transform: none !important;
            opacity: 1 !important;
          }
          .sign-in-container {
            display: none;
          }
          .sign-up-container {
            display: none;
          }
          .auth-shell:not(.right-panel-active) .sign-in-container {
            display: flex;
          }
          .auth-shell:not(.right-panel-active) .sign-up-container {
            display: none !important;
          }
          .auth-shell.right-panel-active .sign-up-container {
            display: flex;
          }
          .auth-shell.right-panel-active .sign-in-container {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .auth-shell {
            width: 100%;
            max-width: none;
            border-radius: 0;
          }
          .form-card {
            padding: 34px 24px;
          }
          .overlay-panel {
            padding: 40px 24px;
          }
          .overlay-panel h2 {
            font-size: 2rem;
          }
        }
      `}</style>

      <div className={`auth-shell min-h-0 w-full flex-1 ${isSignUp ? 'right-panel-active' : ''}`}>
        <div className="auth-shell-sizer" aria-hidden />
        <div className="panel-title">RentScape Access</div>

        <div className="mobile-auth-switch" role="tablist" aria-label="Choose sign in or sign up">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            className={!isSignUp ? 'active' : ''}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            className={isSignUp ? 'active' : ''}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        <div className="form-container sign-up-container">
          <div className="form-card">
            <h1 className="display-serif">Create Account</h1>
            <p>Sign up to manage your rentals, payments, and maintenance from a refined dashboard.</p>
            {error && isSignUp && <div className="error-box">{error}</div>}
            <form onSubmit={handleSignup}>
              <div className="input-field">
                <label className="control-label">Account type</label>
                <select
                  className="input"
                  value={signupForm.role}
                  onChange={e => setSignupForm({ ...signupForm, role: e.target.value as Role })}
                >
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord</option>
                </select>
              </div>
              <div className="input-field">
                <label className="control-label">Full name</label>
                <input
                  className="input"
                  type="text"
                  value={signupForm.full_name}
                  onChange={e => setSignupForm({ ...signupForm, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="input-field">
                <label className="control-label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={signupForm.email}
                  onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="input-field">
                <label className="control-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(v => !v)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer' }}
                  >
                    {showSignupPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="input-field">
                <label className="control-label">Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showConfirm ? 'text' : 'password'}
                    value={signupForm.confirm_password}
                    onChange={e => setSignupForm({ ...signupForm, confirm_password: e.target.value })}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer' }}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="button primary cta-center" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <p className="small-text">Already registered? Switch back to Sign In using the sliding panel or tabs.</p>
          </div>
        </div>

        <div className="form-container sign-in-container">
          <div className="form-card">
            <h1 className="display-serif">Sign In</h1>
            <p>Log in to access your RentScape dashboard and manage your properties effortlessly.</p>
            {error && !isSignUp && <div className="error-box">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="input-field">
                <label className="control-label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="input-field">
                <label className="control-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(v => !v)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer' }}
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="button primary" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p className="small-text">New to RentScape? Use the sliding panel or tabs to create an account.</p>
          </div>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-panel-left">
              <span>Welcome back</span>
              <h2>Already registered?</h2>
              <p>Sign in and continue managing your rentals with a premium dashboard experience.</p>
              <button className="overlay-button" onClick={() => setIsSignUp(false)}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-panel-right">
              <span>New here</span>
              <h2>Create an account</h2>
              <p>Join RentScape and unlock advanced leasing, payment, and maintenance workflows.</p>
              <button className="overlay-button" onClick={() => setIsSignUp(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
