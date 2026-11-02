import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/getErrorMessage'
import { getFieldErrors, type FieldErrors } from '../utils/getFieldErrors'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }

    setSubmitting(true)

    try {
      await register({ name: name.trim(), email: email.trim(), password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error))
      setFieldErrors(getFieldErrors(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up the first administrator, then invite staff members."
      footer={
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <Alert tone="info">
          The <strong>first account</strong> becomes the administrator. Later sign-ups
          are staff accounts and can be promoted by an admin.
        </Alert>

        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Maria Santos"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
          required
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          hint="Use 8–72 characters. A mix of letters and numbers is recommended."
          required
        />

        <TextField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" fullWidth loading={submitting}>
          <UserPlus size={16} aria-hidden />
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
