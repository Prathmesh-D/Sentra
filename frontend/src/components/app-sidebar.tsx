"use client"

import * as React from "react"
import {
  GalleryVerticalEnd,
} from "lucide-react"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { FaStarOfLife } from "react-icons/fa";
import { TbLayoutDashboardFilled } from "react-icons/tb";
import { FaShieldDog } from "react-icons/fa6";
import { MdMoveToInbox } from "react-icons/md";
import { MdOutbox } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Navigation items
const projects = [
  {
    name: "Getting Started",
    url: "GettingStarted",
    icon: FaStarOfLife,
  },
  {
    name: "Dashboard",
    url: "Dashboard",
    icon: TbLayoutDashboardFilled,
  },
  {
    name: "Encrypt",
    url: "Encrypt",
    icon: FaShieldDog,
  },
  {
    name: "Inbox",
    url: "Inbox",
    icon: MdMoveToInbox,
  },
  {
    name: "Outbox",
    url: "Outbox",
    icon: MdOutbox,
  },
  {
    name: "Settings",
    url: "Settings",
    icon: IoMdSettings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNavigate?: (page: string) => void
  currentPage?: string
}

export function AppSidebar({ onNavigate, currentPage, ...props }: AppSidebarProps) {
  const { state, setOpen } = useSidebar()
  const { user } = useAuth()
  
  // Create user data from auth context
  const userData = {
    name: user?.full_name || user?.username || "User",
    email: user?.email || "",
    avatar: "/avatars/shadcn.jpg",
  }
  
  const handleSidebarClick = () => {
    if (state === "collapsed") {
      setOpen(true)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props} className="font-sans" onClick={handleSidebarClick}>
      <SidebarHeader onClick={handleSidebarClick} className="group-data-[collapsible=icon]:items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col items-center justify-center py-6 px-4 group-data-[collapsible=icon]:px-2 transition-all duration-500 ease-in-out">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-16 items-center justify-center rounded-lg shrink-0 mb-3 group-data-[collapsible=icon]:size-14 group-data-[collapsible=icon]:mb-0 transition-all duration-500 ease-in-out scale-hover">
                <GalleryVerticalEnd className="size-8 group-data-[collapsible=icon]:size-7 transition-all duration-500 ease-in-out icon-spin-hover" />
              </div>
              <div className="text-center group-data-[collapsible=icon]:hidden transition-all duration-500">
                <span className="block font-bold text-xl tracking-wide mb-0 transition-all duration-500">Sentra</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent onClick={handleSidebarClick}>
        <NavProjects projects={projects} onNavigate={onNavigate} currentPage={currentPage} />
      </SidebarContent>
      <SidebarFooter onClick={handleSidebarClick}>
        <NavUser user={userData} onNavigate={onNavigate} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
