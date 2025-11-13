import { LoginForm } from "@/components/login-form"

interface LoginPageProps {
  onNavigateToSignup: () => void
  onLogin: () => void
}

export default function LoginPage({ onNavigateToSignup, onLogin }: LoginPageProps) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm 
          onNavigateToSignup={onNavigateToSignup} 
          onLogin={onLogin} 
        />
      </div>
    </div>
  )
}
