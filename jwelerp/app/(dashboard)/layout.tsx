import { redirect } from "next/navigation"
import { getAuthFromCookie } from "@/lib/auth"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthFromCookie()
  if (!user) redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
