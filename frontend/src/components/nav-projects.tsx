"use client"

import {
  type LucideIcon,
} from "lucide-react"
import type { IconType } from "react-icons"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
  onNavigate,
  currentPage,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon | IconType
  }[]
  onNavigate?: (page: string) => void
  currentPage?: string
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:px-0">
      <SidebarMenu className="gap-2 px-2 group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-0">
        {projects.map((item) => {
          const isActive = currentPage === item.url
          return (
            <SidebarMenuItem key={item.name} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton 
                asChild={!onNavigate}
                tooltip={item.name}
                className={`h-14 group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!w-16 group-data-[collapsible=icon]:!min-w-16 group-data-[collapsible=icon]:!p-0 cursor-pointer transition-all duration-500 ease-in-out relative group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl ${
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 shadow-sm hover:shadow-md' 
                    : 'hover:bg-sidebar-accent/30 hover:scale-105'
                }`}
                onClick={() => onNavigate?.(item.url)}
              >
                {onNavigate ? (
                  <div className="flex items-center gap-4 min-w-0 w-full group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-sidebar-primary rounded-r-full group-data-[collapsible=icon]:hidden animate-in slide-in-from-left duration-300" />
                    )}
                    <item.icon className={`group-data-[collapsible=icon]:size-7 size-6 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-all duration-500 ease-in-out icon-bounce-hover`} />
                    <span className={`text-base whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'} group-data-[collapsible=icon]:hidden transition-all duration-500`}>{item.name}</span>
                  </div>
                ) : (
                  <a href={item.url} className="flex items-center gap-4 min-w-0 w-full group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-sidebar-primary rounded-r-full group-data-[collapsible=icon]:hidden animate-in slide-in-from-left duration-300" />
                    )}
                    <item.icon className={`group-data-[collapsible=icon]:size-7 size-6 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-all duration-500 ease-in-out icon-bounce-hover`} />
                    <span className={`text-base whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'} group-data-[collapsible=icon]:hidden transition-all duration-500`}>{item.name}</span>
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
