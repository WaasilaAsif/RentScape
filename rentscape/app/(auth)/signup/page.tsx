'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type Role = 'tenant' | 'landlord'

interface FormData {
  role: Role
  full_name: string
  phone: string
  cnic: string
  address: string
  email: string
  password: string
  confirm_password: string
  emergency_contact_name: string
  emergency_contact_phone: string
}

const EMPTY: FormData = {
  role: 'tenant',
  full_name: '',
  phone: '',
  cnic: '',
  address: '',
  email: '',
  password: '',
  confirm_password: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
}

function formatCNIC(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 13)
  if (d.length <= 5) return d
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
}

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  return d
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f97316' },
    { label: 'Good', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
  ]
  return { score, ...levels[score] }
}

const TOTAL_STEPS = 4

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  function validateStep(s: number): boolean {
    const e: Partial<Record<keyof FormData, string>> = {}

    if (s === 1) {
      if (!form.full_name.trim()) e.full_name = 'Full name is required.'
      if (!form.phone.trim()) e.phone = 'Phone number is required.'
      else if (!/^0\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 11-digit Pakistani number (e.g. 03001234567).'
      if (!form.cnic.trim()) e.cnic = 'CNIC is required.'
      else if (!/^\d{5}-\d{7}-\d$/.test(form.cnic)) e.cnic = 'Format must be 12345-1234567-1.'
      if (!form.address.trim()) e.address = 'Address is required.'
    }

    if (s === 2) {
      if (!form.email.trim()) e.email = 'Email is required.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
      if (!form.password) e.password = 'Password is required.'
      else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
      if (!form.confirm_password) e.confirm_password = 'Please confirm your password.'
      else if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.'
    }

    if (s === 3 && form.role === 'tenant') {
      if (!form.emergency_contact_name.trim()) e.emergency_contact_name = 'Emergency contact name is required.'
      if (!form.emergency_contact_phone.trim()) e.emergency_contact_phone = 'Emergency contact phone is required.'
      else if (!/^0\d{10}$/.test(form.emergency_contact_phone)) e.emergency_contact_phone = 'Enter a valid 11-digit number.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    const validStep = step === 2 ? 2 : step === 3 ? 3 : 1
    if (validateStep(validStep)) {
      setStep(s => {
        const next = s + 1
        // Skip emergency contact step for landlords
        if (next === 3 && form.role === 'landlord') return 4
        return next
      })
    }
  }

  function prevStep() {
    setStep(s => {
      const prev = s - 1
      if (prev === 3 && form.role === 'landlord') return 2
      return prev
    })
  }

  function getActualStep() {
    if (form.role === 'landlord') {
      if (step <= 2) return step
      return step - 1 // steps 1,2,4 → displayed as 1,2,3
    }
    return step
  }

  function getTotalDisplaySteps() {
    return form.role === 'landlord' ? 3 : TOTAL_STEPS
  }

  async function handleSubmit() {
    const lastValidStep = form.role === 'tenant' ? 3 : 2
    if (!validateStep(lastValidStep)) return

    setLoading(true)
    setApiError(null)

    const metadata: Record<string, string> = {
      full_name: form.full_name.trim(),
      role: form.role,
      phone: form.phone.trim(),
      cnic: form.cnic.trim(),
      address: form.address.trim(),
    }
    if (form.role === 'tenant') {
      metadata.emergency_contact_name = form.emergency_contact_name.trim()
      metadata.emergency_contact_phone = form.emergency_contact_phone.trim()
    }

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: metadata },
    })

    if (error) {
      setApiError(error.message)
      setLoading(false)
      return
    }

    router.push(form.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard')
  }

  const pwStrength = passwordStrength(form.password)

  return (
    <>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob-float {
          0%, 100% { transform: translate(0,0) scale(1); }
          40%       { transform: translate(18px,-14px) scale(1.04); }
          70%       { transform: translate(-12px,10px) scale(0.97); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .bg-anim {
          background: linear-gradient(-45deg, #071928, #0474C4, #06457F, #2C444C, #050f1a);
          background-size: 400% 400%;
          animation: gradient-shift 14s ease infinite;
        }
        .card-appear { animation: fade-up 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .step-slide  { animation: slide-in 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        .blob  { animation: blob-float 9s ease-in-out infinite; }
        .blob2 { animation: blob-float 12s ease-in-out infinite reverse; animation-delay: -5s; }
        .input-glass {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          color: #fff;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .input-glass::placeholder { color: rgba(147,197,253,0.45); }
        .input-glass:focus {
          outline: none;
          background: rgba(255,255,255,0.12);
          border-color: rgba(96,165,250,0.7);
          box-shadow: 0 0 0 3px rgba(96,165,250,0.15);
        }
        .input-error {
          border-color: rgba(239,68,68,0.7) !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
        }
        .role-card {
          border: 2px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          transition: all 0.2s;
          cursor: pointer;
        }
        .role-card:hover { background: rgba(255,255,255,0.1); border-color: rgba(96,165,250,0.5); }
        .role-card.active { background: rgba(59,130,246,0.2); border-color: rgba(96,165,250,0.8); }
      `}</style>

      <div className="bg-anim min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="blob absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="blob2 absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg card-appear">
          {/* Brand */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-blue-200/70 text-sm mt-1">Step {getActualStep()} of {getTotalDisplaySteps()}</p>
          </div>

          {/* Progress bar */}
          <div className="mb-6 flex gap-1.5">
            {Array.from({ length: getTotalDisplaySteps() }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ background: i < getActualStep() ? '#3b82f6' : 'transparent', width: '100%' }} />
              </div>
            ))}
          </div>

          {/* Card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(24px)', borderRadius: '24px' }}
            className="p-8 shadow-2xl">

            {/* ── STEP 0: Role selection ── */}
            {step === 1 && (
              <div className="step-slide space-y-5">
                <div>
                  <h2 className="text-white font-semibold text-lg mb-1">I am a…</h2>
                  <p className="text-blue-200/60 text-sm">Choose your account type to get started.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['tenant', 'landlord'] as Role[]).map(r => (
                    <button key={r} type="button" onClick={() => set('role', r)}
                      className={`role-card rounded-2xl p-5 text-left ${form.role === r ? 'active' : ''}`}>
                      <div className="mb-3">
                        {r === 'tenant'
                          ? <svg className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          : <svg className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        }
                      </div>
                      <p className="text-white font-semibold capitalize">{r}</p>
                      <p className="text-blue-200/60 text-xs mt-0.5">
                        {r === 'tenant' ? 'Looking for a place to rent' : 'Managing rental properties'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pt-1">
                  <Field label="Full Name" error={errors.full_name}>
                    <InputGlass icon={<PersonIcon />}
                      placeholder="Muhammad Ali" value={form.full_name}
                      onChange={v => set('full_name', v)} hasError={!!errors.full_name} />
                  </Field>
                  <Field label="Phone Number" error={errors.phone}>
                    <InputGlass icon={<PhoneIcon />}
                      placeholder="03001234567" value={form.phone}
                      onChange={v => set('phone', formatPhone(v))} hasError={!!errors.phone} />
                  </Field>
                  <Field label="CNIC" error={errors.cnic} hint="Format: 12345-1234567-1">
                    <InputGlass icon={<IdIcon />}
                      placeholder="12345-1234567-1" value={form.cnic}
                      onChange={v => set('cnic', formatCNIC(v))} hasError={!!errors.cnic} />
                  </Field>
                  <Field label="Address" error={errors.address}>
                    <InputGlass icon={<MapPinIcon />}
                      placeholder="House #, Street, City" value={form.address}
                      onChange={v => set('address', v)} hasError={!!errors.address} />
                  </Field>
                </div>

                <NavButtons onNext={nextStep} hideBack />
              </div>
            )}

            {/* ── STEP 2: Account credentials ── */}
            {step === 2 && (
              <div className="step-slide space-y-5">
                <div>
                  <h2 className="text-white font-semibold text-lg mb-1">Account credentials</h2>
                  <p className="text-blue-200/60 text-sm">These are used to sign in to your account.</p>
                </div>

                <Field label="Email Address" error={errors.email}>
                  <InputGlass icon={<MailIcon />}
                    placeholder="you@example.com" value={form.email} type="email"
                    onChange={v => set('email', v)} hasError={!!errors.email} />
                </Field>

                <Field label="Password" error={errors.password}>
                  <div className="relative">
                    <InputGlass icon={<LockIcon />}
                      placeholder="Min. 8 characters" value={form.password}
                      type={showPw ? 'text' : 'password'}
                      onChange={v => set('password', v)} hasError={!!errors.password}
                      rightSlot={<EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />} />
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= pwStrength.score ? pwStrength.color : 'rgba(255,255,255,0.15)' }} />
                        ))}
                      </div>
                      {pwStrength.label && (
                        <p className="text-xs" style={{ color: pwStrength.color }}>{pwStrength.label} password</p>
                      )}
                    </div>
                  )}
                </Field>

                <Field label="Confirm Password" error={errors.confirm_password}>
                  <InputGlass icon={<LockIcon />}
                    placeholder="Re-enter password" value={form.confirm_password}
                    type={showConfirm ? 'text' : 'password'}
                    onChange={v => set('confirm_password', v)} hasError={!!errors.confirm_password}
                    rightSlot={<EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
                </Field>

                <NavButtons onNext={nextStep} onBack={prevStep} />
              </div>
            )}

            {/* ── STEP 3: Emergency contact (tenant only) ── */}
            {step === 3 && form.role === 'tenant' && (
              <div className="step-slide space-y-5">
                <div>
                  <h2 className="text-white font-semibold text-lg mb-1">Emergency contact</h2>
                  <p className="text-blue-200/60 text-sm">Required for tenant verification — someone we can reach in emergencies.</p>
                </div>

                <Field label="Contact Full Name" error={errors.emergency_contact_name}>
                  <InputGlass icon={<PersonIcon />}
                    placeholder="Father / Spouse name" value={form.emergency_contact_name}
                    onChange={v => set('emergency_contact_name', v)} hasError={!!errors.emergency_contact_name} />
                </Field>

                <Field label="Contact Phone" error={errors.emergency_contact_phone}>
                  <InputGlass icon={<PhoneIcon />}
                    placeholder="03001234567" value={form.emergency_contact_phone}
                    onChange={v => set('emergency_contact_phone', formatPhone(v))} hasError={!!errors.emergency_contact_phone} />
                </Field>

                <NavButtons onNext={nextStep} onBack={prevStep} />
              </div>
            )}

            {/* ── STEP 4: Review & Submit ── */}
            {step === 4 && (
              <div className="step-slide space-y-5">
                <div>
                  <h2 className="text-white font-semibold text-lg mb-1">Review & confirm</h2>
                  <p className="text-blue-200/60 text-sm">Check your details before creating the account.</p>
                </div>

                <div className="space-y-2 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {[
                    ['Role', form.role.charAt(0).toUpperCase() + form.role.slice(1)],
                    ['Name', form.full_name],
                    ['Phone', form.phone],
                    ['CNIC', form.cnic],
                    ['Address', form.address],
                    ['Email', form.email],
                    ...(form.role === 'tenant' ? [
                      ['Emergency contact', form.emergency_contact_name],
                      ['Emergency phone', form.emergency_contact_phone],
                    ] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-blue-200/60 text-sm shrink-0">{label}</span>
                      <span className="text-white text-sm text-right truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {apiError && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px' }}
                    className="flex items-start gap-2.5 px-4 py-3">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300 text-sm">{apiError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={prevStep}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-blue-200 transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                    Back
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="flex-2 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: loading ? 'rgba(96,165,250,0.5)' : 'rgba(59,130,246,0.9)', cursor: loading ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(96,165,250,0.95)' }}
                    onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.9)' }}>
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account…
                      </>
                    ) : 'Create Account'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-blue-200/70 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-white font-semibold hover:text-blue-200 transition-colors underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Small reusable sub-components ─── */

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">{label}</label>
        {hint && !error && <span className="text-xs text-blue-300/50">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  )
}

function InputGlass({ icon, placeholder, value, onChange, type = 'text', hasError, rightSlot }: {
  icon: React.ReactNode; placeholder: string; value: string
  onChange: (v: string) => void; type?: string; hasError?: boolean; rightSlot?: React.ReactNode
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/60 pointer-events-none">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`input-glass w-full rounded-xl pl-10 ${rightSlot ? 'pr-11' : 'pr-4'} py-3 text-sm ${hasError ? 'input-error' : ''}`}
      />
      {rightSlot && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
      )}
    </div>
  )
}

function NavButtons({ onNext, onBack, hideBack }: { onNext: () => void; onBack?: () => void; hideBack?: boolean }) {
  return (
    <div className="flex gap-3 pt-1">
      {!hideBack && onBack && (
        <button type="button" onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-blue-200 transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
          Back
        </button>
      )}
      <button type="button" onClick={onNext}
        className={`${hideBack ? 'w-full' : 'flex-2'} py-3 rounded-xl text-sm font-semibold text-white transition-all`}
        style={{ background: 'rgba(59,130,246,0.9)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.95)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.9)')}>
        Continue
      </button>
    </div>
  )
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="text-blue-300/60 hover:text-white transition-colors">
      {show
        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      }
    </button>
  )
}

function PersonIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
}
function PhoneIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
}
function IdIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
}
function MapPinIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function MailIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}
function LockIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
}
