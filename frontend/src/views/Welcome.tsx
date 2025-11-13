import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { FiBell } from "react-icons/fi"

interface WelcomePageProps {
  children: React.ReactNode
  onNavigate: (page: string) => void
  currentPage?: string
}

export default function Page({ children, onNavigate, currentPage }: WelcomePageProps) {
  const [unreadCount, setUnreadCount] = useState(3)

  // Mock function to simulate getting unread notifications
  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll use mock data
    const mockUnreadCount = 3
    setUnreadCount(mockUnreadCount)
  }, [currentPage])

  // Format the page name for display
  const getPageDisplayName = (page?: string) => {
    if (!page) return 'Dashboard'
    // Convert camelCase or PascalCase to Title Case with spaces
    return page.replace(/([A-Z])/g, ' $1').trim()
  }

  const handleNotificationClick = () => {
    onNavigate('Notifications')
  }

  return (
    <SidebarProvider>
      <AppSidebar onNavigate={onNavigate} currentPage={currentPage} />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-[71px] shrink-0 items-center gap-2 transition-[width,height] ease-linear bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 px-4 w-full">
            <SidebarTrigger className="-ml-1 !h-11 !w-11 !min-h-11 !min-w-11" />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-8"
            />
            <h1 className="text-2xl font-bold tracking-tight">{getPageDisplayName(currentPage)}</h1>
            
            {/* Notification Bell Icon */}
            <div className="ml-auto">
              <button
                onClick={handleNotificationClick}
                className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                title="Notifications"
              >
                <FiBell className="w-6 h-6 text-gray-700 group-hover:text-[#084d45] transition-colors duration-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2b5d4] opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-gradient-to-r from-[#f2b5d4] to-[#f7d6e0] text-[#480d2a] text-xs font-bold border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#eff7f6]" style={{ scrollbarGutter: 'stable' }}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
