import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { useAuthContext } from '@/context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getLoginErrorMessage } from '@/utils/authErrors'
import { LoginIllustration } from './LoginIllustration'

const REMEMBER_KEY = 'login.rememberEmail'

export default function LoginPage() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    try {
      await login(trimmedEmail, trimmedPassword)
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, trimmedEmail)
      else localStorage.removeItem(REMEMBER_KEY)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — brand */}
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="pointer-events-none absolute -right-20 top-0 size-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3 px-10 pt-10 xl:px-14">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white text-primary shadow-lg">
            <Wrench className="size-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/55">
              Maintenance Tracker
            </p>
            <p className="text-lg font-semibold tracking-tight text-primary-foreground">Machine Operations</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 xl:px-14">
          <LoginIllustration />
          <div className="mt-10 max-w-sm text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-primary-foreground">
              Professional maintenance control
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/65">
              Track assets, schedule repairs, and monitor performance from one secure dashboard.
            </p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 px-10 py-5 xl:px-14">
          <p className="flex items-center justify-center gap-2 text-xs text-primary-foreground/50">
            <ShieldCheck className="size-3.5" />
            Secure access for authorized teams
          </p>
        </div>
      </aside>

      {/* Right — form */}
      <main className="relative flex min-h-screen flex-col bg-muted/30">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#d4d4d8 0.7px, transparent 0.7px)',
            backgroundSize: '18px 18px',
          }}
        />

        <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Wrench className="size-5" />
              </div>
              <p className="text-lg font-semibold tracking-tight">Sign in</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_60px_-28px_rgba(0,0,0,0.18)]">
              <div className="border-b border-border bg-muted/30 px-6 py-5 sm:px-8">
                <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">Sign in to open your dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(error)}
                      className="h-11 border-border/80 bg-background pl-10 shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      aria-invalid={Boolean(error)}
                      className="h-11 border-border/80 bg-background pl-10 pr-10 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v === true)}
                  />
                  <Label htmlFor="remember" className="cursor-pointer font-normal text-muted-foreground">
                    Remember my email
                  </Label>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive/25 bg-destructive/5">
                    <AlertCircle />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" size="lg" className="h-11 w-full font-semibold" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in to dashboard
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Machine Maintenance Tracker
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
