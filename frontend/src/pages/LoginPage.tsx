import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/getErrorMessage'
import { getFieldErrors, type FieldErrors } from '../utils/getFieldErrors'

interface LocationState {
  from?: { pathname?: string }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ProtectedRoute stores the page the visitor wanted before being redirected.
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? '/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error))
      setFieldErrors(getFieldErrors(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage sales, stock and business reports."
      footer={
        <p>
          New to the system?{' '}
          <Link
            to="/register"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="owner@shop.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          required
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" fullWidth loading={submitting}>
          <LogIn size={16} aria-hidden />
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-xs leading-relaxed text-stone-500">
          By default, sessions last 7 days. After that, sign in again to continue.
        </p>
      </form>
    </AuthLayout>
  )
}
