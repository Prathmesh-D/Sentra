import { cn } from "@/lib/utils"
import { useState } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import sideimage from "@/assets/SideImage.png"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

interface SignupFormProps extends React.ComponentProps<"div"> {
  onNavigateToLogin?: () => void
}

function validateUsername(value: string): string {
  if (!value.trim()) return "Username is required."
  if (!/^[a-z0-9_]{3,20}$/.test(value.trim())) {
    return "Use 3-20 lowercase letters, numbers, or underscores."
  }
  return ""
}

function validateEmail(value: string): string {
  if (!value.trim()) return "Email is required."
  if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(value.trim())) {
    return "Please enter a valid email address."
  }
  return ""
}

function validateStrongPassword(value: string): string {
  if (!value) return "Password is required."
  if (value.length < 8) return "Use at least 8 characters."
  if (!/[A-Z]/.test(value)) return "Include at least one uppercase letter."
  if (!/[0-9]/.test(value)) return "Include at least one number."
  if (!/[^A-Za-z0-9]/.test(value)) return "Include at least one special character."
  return ""
}

function passwordStrength(value: string): { score: number; label: string } {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[0-9]/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong"
  return { score, label }
}

export function SignupForm({
  className,
  onNavigateToLogin,
  ...props
}: SignupFormProps) {
  const { register } = useAuth()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const usernameError = touched.username ? validateUsername(username) : ""
  const emailError = touched.email ? validateEmail(email) : ""
  const passwordRuleError = touched.password ? validateStrongPassword(password) : ""
  const confirmPasswordError = touched.confirmPassword && confirmPassword !== password
    ? "Passwords do not match"
    : ""
  const strength = passwordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validateStrongPassword(password),
      confirmPassword: confirmPassword !== password ? "Passwords do not match" : "",
    }

    setTouched({ username: true, email: true, password: true, confirmPassword: true })
    setFieldErrors(nextErrors)

    const firstError = Object.values(nextErrors).find(Boolean)
    if (firstError) {
      toast.error(firstError)
      return
    }

    setIsLoading(true)

    try {
      await register(username.trim(), email.trim(), password)
      // Registration successful, navigate handled by AuthContext
      setTimeout(() => {
        onNavigateToLogin?.()
      }, 1500)
    } catch (error) {
      // Error is handled by AuthContext (shows toast)
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 auth-form-enter">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your details below to create your account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase()
                    setUsername(value)
                    setFieldErrors((prev) => ({ ...prev, username: touched.username ? validateUsername(value) : "" }))
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                  disabled={isLoading}
                  required
                />
                <FieldDescription>
                  3-20 chars, lowercase letters, numbers, and underscores only.
                </FieldDescription>
                {(fieldErrors.username || usernameError) ? (
                  <FieldDescription className="text-red-500">{fieldErrors.username || usernameError}</FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value
                    setEmail(value)
                    setFieldErrors((prev) => ({ ...prev, email: touched.email ? validateEmail(value) : "" }))
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  disabled={isLoading}
                  required
                />
                {(fieldErrors.email || emailError) ? (
                  <FieldDescription className="text-red-500">{fieldErrors.email || emailError}</FieldDescription>
                ) : null}
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Create password"
                        disabled={isLoading}
                        required
                        className="pr-10 text-sm"
                        value={password}
                        onChange={(e) => {
                          const value = e.target.value
                          setPassword(value)
                          setFieldErrors((prev) => ({ ...prev, password: touched.password ? validateStrongPassword(value) : "" }))
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-md p-1 transition-colors duration-200 pointer-events-auto"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <div className="relative">
                      <Input 
                        id="confirm-password" 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        className="text-sm pr-10"
                        disabled={isLoading}
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value
                          setConfirmPassword(value)
                          setFieldErrors((prev) => ({
                            ...prev,
                            confirmPassword: touched.confirmPassword && value !== password ? "Passwords do not match" : "",
                          }))
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-md p-1 transition-colors duration-200 pointer-events-auto"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters, with uppercase, number, and special character.
                </FieldDescription>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((segment) => (
                    <div
                      key={segment}
                      className={`h-2 flex-1 rounded-full transition-all duration-150 ${
                        strength.score >= segment
                          ? segment === 1
                            ? "bg-red-500"
                            : segment === 2
                              ? "bg-orange-500"
                              : segment === 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <FieldDescription className="mt-1">{strength.label}</FieldDescription>
                {(fieldErrors.password || passwordRuleError) ? (
                  <FieldDescription className="text-red-500">{fieldErrors.password || passwordRuleError}</FieldDescription>
                ) : null}
                {(fieldErrors.confirmPassword || confirmPasswordError) ? (
                  <FieldDescription className="text-red-500">{fieldErrors.confirmPassword || confirmPasswordError}</FieldDescription>
                ) : null}
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Creating Account...
                    </span>
                  ) : "Create Account"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Already have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigateToLogin?.()
                  }}
                  className="underline"
                >
                  Sign in
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src={sideimage}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
