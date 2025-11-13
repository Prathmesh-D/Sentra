import {
  LogOut,
  Mail,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"

export function NavUser({
  user,
  onNavigate,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  onNavigate?: (page: string) => void
}) {
  const { logout } = useAuth()

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (confirmed) {
      try {
        await logout()
        // Navigate to login page after successful logout
        onNavigate?.('login')
      } catch (error) {
        console.error('Logout failed:', error)
        // Still navigate to login even if logout API fails
        onNavigate?.('login')
      }
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Expanded Sidebar - Full User Card */}
        <div className="flex flex-col gap-0 group-data-[collapsible=icon]:hidden transition-all duration-500">
          {/* User Card */}
          <div className="relative mx-3 mb-3 p-4 bg-gradient-to-br from-[#b2f7ef] via-[#97eeff] to-[#b2f7ef] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] overflow-hidden transition-all duration-300 animate-float">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-12 -mb-12"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Avatar and Name Section */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-14 w-14 rounded-xl ring-4 ring-white/30 shadow-md">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-white text-[#084d45] font-bold text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#084d45] truncate text-base leading-tight mb-1">
                    {user.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[#084d45]/70">
                    <Mail className="size-3.5 flex-shrink-0" />
                    <p className="text-xs truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 mb-3"></div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white/90 hover:bg-white text-red-600 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md btn-click-animation"
              >
                <LogOut className="size-4 icon-bounce-hover" />
                <span className="text-sm">Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsed Sidebar - Compact View */}
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-3 group-data-[collapsible=icon]:p-2 transition-all duration-500">
          {/* Avatar */}
          <div className="relative animate-float">
            <Avatar className="h-12 w-12 rounded-xl ring-2 ring-[#b2f7ef]/50 shadow-[0_4px_20px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.18)] transition-shadow duration-300">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#b2f7ef] to-[#97eeff] text-[#084d45] font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-sidebar shadow-sm"></div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-12 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            title="Log out"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
