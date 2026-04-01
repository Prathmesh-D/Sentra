"use client"

import * as React from "react"
import SentraLogo from "@/assets/Sentra.svg"

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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNavigate?: (page: string) => void
  currentPage?: string
  inboxCount?: number
  outboxCount?: number
}

export function AppSidebar({ onNavigate, currentPage, inboxCount = 0, outboxCount = 0, ...props }: AppSidebarProps) {
  const { state, setOpen } = useSidebar()
  const { user } = useAuth()

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
      badgeCount: inboxCount > 0 ? inboxCount : undefined,
    },
    {
      name: "Outbox",
      url: "Outbox",
      icon: MdOutbox,
      badgeCount: outboxCount > 0 ? outboxCount : undefined,
    },
    {
      name: "Settings",
      url: "Settings",
      icon: IoMdSettings,
    },
  ]
  
  // Create user data from auth context
  const userData = {
    name: user?.full_name || user?.username || "User",
    email: user?.email || "",
    avatar: user?.avatar_url || "",
  }
  
  const handleSidebarClick = () => {
    if (state === "collapsed") {
      setOpen(true)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props} className="font-sans" onClick={handleSidebarClick}>
      <SidebarHeader onClick={handleSidebarClick} className="items-center px-2 pt-6 pb-4 group-data-[collapsible=icon]:items-center">
        <img
          src={SentraLogo}
          alt="Sentra"
          className="block w-[15.5rem] max-w-full h-auto object-contain group-data-[collapsible=icon]:hidden"
        />
        <SidebarSeparator className="mt-3 bg-slate-900/18 dark:bg-slate-100/18 opacity-70 group-data-[collapsible=icon]:hidden" />
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
