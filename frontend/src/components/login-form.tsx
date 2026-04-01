import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
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
import { clearDashboardCache } from "@/views/Dashboard"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onNavigateToSignup?: () => void
  onLogin?: (username: string) => void
  onDemoLogin?: () => Promise<void>
}

export function LoginForm({
  className,
  onNavigateToSignup,
  onLogin,
  onDemoLogin,
  ...props
}: LoginFormProps) {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const passwordRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  // Clear form fields when component mounts (e.g., after logout)
  useEffect(() => {
    setUsername("")
    if (passwordRef.current) {
      passwordRef.current.value = ""
    }
    setIsLoading(false)
    if (window.electronAPI?.focusWindow) {
      window.electronAPI.focusWindow()
    }
    requestAnimationFrame(() => {
      usernameRef.current?.focus()
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Clear any cached dashboard data from previous session
      clearDashboardCache()
      
      // Using ref preserves the same input node to keep caret stable
      const passwordValue = passwordRef.current?.value ?? ""
      await login(username, passwordValue)
      onLogin?.(username)
    } catch (error) {
      // Error is handled by AuthContext (shows toast)
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    if (!onDemoLogin) return
    setIsDemoLoading(true)
    try {
      await onDemoLogin()
    } finally {
      setIsDemoLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 auth-form-enter">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground">
                  Login to your Sentra account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  ref={usernameRef}
                  autoFocus
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    disabled={isLoading}
                    required
                    className="pr-10"
                    ref={passwordRef}
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
                <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Logging in...
                    </span>
                  ) : "Login"}
                </Button>
              </Field>
              <FieldDescription className="text-center -mt-3 mb-1">
                Don&apos;t have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigateToSignup?.()
                  }}
                  className="underline"
                >
                  Sign up
                </a>
              </FieldDescription>

              <div className="relative my-0">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-gray-500">or</span>
                </div>
              </div>

              <Field className="mt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoLogin}
                  disabled={isLoading || isDemoLoading}
                  className="w-full demo-shimmer-btn hover:bg-[#fff5dd] transition-all duration-300"
                >
                  {isDemoLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Setting up demo...
                    </span>
                  ) : (
                    '✨ Explore Demo — No account needed'
                  )}
                </Button>
                <p className="text-center text-xs text-gray-500 mt-1">
                  Pre-loaded with sample data · Nothing is saved · Exit anytime
                </p>
              </Field>
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
