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
    badgeCount?: number
  }[]
  onNavigate?: (page: string) => void
  currentPage?: string
}) {
  const activeIndex = projects.findIndex((p) => p.url === currentPage)
  const itemHeightRem = 3.5 // h-14
  const itemGapRem = 0.5 // gap-2

  return (
    <SidebarGroup className="pt-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-2">
      <SidebarMenu className="relative gap-2 px-2 group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-0">
        {/* Sliding active indicator */}
        {activeIndex >= 0 && (
          <div
            className="pointer-events-none absolute left-2 right-2 top-0 h-14 rounded-xl bg-sidebar-accent/90 shadow-sm ring-1 ring-sidebar-border/40 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-[collapsible=icon]:hidden"
            style={{ transform: `translateY(calc(${activeIndex} * (${itemHeightRem}rem + ${itemGapRem}rem)))` }}
          />
        )}
        {projects.map((item) => {
          const isActive = currentPage === item.url
          const hasBadge = typeof item.badgeCount === 'number' && item.badgeCount > 0
          return (
            <SidebarMenuItem key={item.name} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton 
                asChild={!onNavigate}
                tooltip={item.name}
                className={`h-14 group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!w-16 group-data-[collapsible=icon]:!min-w-16 group-data-[collapsible=icon]:!p-0 cursor-pointer transition-all duration-500 ease-in-out relative z-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl ${
                  isActive 
                    ? 'text-sidebar-accent-foreground hover:bg-sidebar-accent/80' 
                    : 'hover:bg-sidebar-accent/30 hover:scale-105'
                }`}
                onClick={() => onNavigate?.(item.url)}
              >
                {onNavigate ? (
                  <div className="flex items-center gap-4 min-w-0 w-full relative group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                    <item.icon className={`group-data-[collapsible=icon]:size-7 size-6 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-all duration-500 ease-in-out icon-bounce-hover`} />
                    <span className={`text-base whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'} group-data-[collapsible=icon]:hidden transition-all duration-500`}>{item.name}</span>
                    {hasBadge && (
                      <>
                        <span className="tab-count-bubble ml-auto shrink-0 group-data-[collapsible=icon]:hidden">
                          {item.badgeCount! > 99 ? '99+' : item.badgeCount}
                        </span>
                        <span className="tab-count-bubble tab-count-bubble-collapsed hidden group-data-[collapsible=icon]:inline-flex">
                          {item.badgeCount! > 99 ? '99+' : item.badgeCount}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <a href={item.url} className="flex items-center gap-4 min-w-0 w-full relative group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                    <item.icon className={`group-data-[collapsible=icon]:size-7 size-6 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-all duration-500 ease-in-out icon-bounce-hover`} />
                    <span className={`text-base whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'} group-data-[collapsible=icon]:hidden transition-all duration-500`}>{item.name}</span>
                    {hasBadge && (
                      <>
                        <span className="tab-count-bubble ml-auto shrink-0 group-data-[collapsible=icon]:hidden">
                          {item.badgeCount! > 99 ? '99+' : item.badgeCount}
                        </span>
                        <span className="tab-count-bubble tab-count-bubble-collapsed hidden group-data-[collapsible=icon]:inline-flex">
                          {item.badgeCount! > 99 ? '99+' : item.badgeCount}
                        </span>
                      </>
                    )}
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
