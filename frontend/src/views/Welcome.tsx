import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"

interface WelcomePageProps {
  children: React.ReactNode
  onNavigate: (page: string) => void
  currentPage?: string
  inboxCount?: number
  outboxCount?: number
}

export default function Page({ children, onNavigate, currentPage, inboxCount, outboxCount }: WelcomePageProps) {
  const { isDemo, clearDemoSession } = useAuth()
  const [exitingDemo, setExitingDemo] = useState(false)

  // Format the page name for display
  const getPageDisplayName = (page?: string) => {
    if (!page) return 'Dashboard'
    // Convert camelCase or PascalCase to Title Case with spaces
    return page.replace(/([A-Z])/g, ' $1').trim()
  }

  const handleExitDemo = () => {
    setExitingDemo(true)
    setTimeout(() => {
      clearDemoSession()
      onNavigate('login')
    }, 180)
  }

  return (
    <SidebarProvider>
      <AppSidebar
        onNavigate={onNavigate}
        currentPage={currentPage}
        inboxCount={inboxCount}
        outboxCount={outboxCount}
      />
      <SidebarInset className={`flex flex-col h-screen overflow-hidden ${exitingDemo ? 'demo-app-fade-out' : ''}`}>
        {isDemo && (
          <div className="h-[38px] flex items-center justify-between px-4 bg-amber-400 text-amber-950 border-b border-amber-500/60 demo-banner-enter">
            <p className="text-sm font-medium">👋 Demo Mode — Sample data only · Nothing you do here is saved</p>
            <button
              onClick={handleExitDemo}
              className="text-sm font-semibold hover:underline underline-offset-4"
            >
              Exit Demo →
            </button>
          </div>
        )}
        <header className="flex h-[71px] shrink-0 items-center gap-2 transition-[width,height] ease-linear bg-[#ffffff] border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 px-4 w-full">
            <SidebarTrigger className="-ml-1 !h-11 !w-11 !min-h-11 !min-w-11" />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-8"
            />
            <h1 className="text-2xl font-bold tracking-tight">{getPageDisplayName(currentPage)}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#eff7f6]" style={{ scrollbarGutter: 'stable' }}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
