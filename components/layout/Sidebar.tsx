"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import type { AuthUser } from "@/lib/auth"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/inventory", label: "Inventory", icon: "◈" },
  { href: "/sales", label: "Sales", icon: "◎" },
  { href: "/production", label: "Production", icon: "◐" },
  { href: "/rates", label: "Rates Master", icon: "₹" },
  { href: "/analytics", label: "Analytics", icon: "▲" },
  { href: "/settings", label: "Settings", icon: "⚙" },
]

export default function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await fetch("/api/auth/me", { method: "POST" })
    toast.success("Signed out")
    router.push("/login")
    router.refresh()
  }

  return (
    <aside
      className="flex flex-col bg-[#1a1a2e] border-r border-[#2d2d4e] transition-all duration-200 shrink-0"
      style={{ width: collapsed ? 60 : 200 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#2d2d4e]">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0">◆</div>
        {!collapsed && <span className="text-white font-bold text-sm tracking-widest">J-SOURCE</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all border-l-[3px] ${
                active
                  ? "bg-red-500 text-white border-white"
                  : "text-slate-400 hover:text-white hover:bg-[#2d2d4e] border-transparent"
              }`}
              style={{ paddingLeft: collapsed ? 16 : 16 }}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#2d2d4e]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          <span className="text-base">{collapsed ? "›" : "‹"}</span>
          {!collapsed && "Collapse"}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <span className="text-base">→</span>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  )
}
