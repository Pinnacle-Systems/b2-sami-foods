import { useState, useEffect } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { LayoutDashboard, Tag, Package, LogOut, Menu, X, ShieldCheck, Sun, Moon, Scale, ShoppingCart } from "lucide-react"
import { useAppDispatch, useAppSelector } from "../../redux/Dispatch/useAppDispatch"
import { logout, selectCurrentUser } from "../../redux/features/authSlice"
import { useAdminTheme } from "../../hooks/useAdminTheme"

const navItems = [
  { label: "Dashboard",               to: "/admin/dashboard",        icon: LayoutDashboard },
  { label: "Product Category Master", to: "/admin/product-category", icon: Tag },
  { label: "Product Master",          to: "/admin/product-master",   icon: Package },
  { label: "UOM Master",              to: "/admin/uom-master",       icon: Scale },
  { label: "Orders",                  to: "/admin/orders",           icon: ShoppingCart },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth > 1024 : true
  )

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 1024)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const { isDark, toggle } = useAdminTheme()

  const handleLogout = () => {
    dispatch(logout())
    navigate("/admin")
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background flex">

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-card border-r border-border flex flex-col transition-all duration-300 shrink-0`}>
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                <span className="text-foreground font-bold text-sm">Admin Panel</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                   ${isActive
                     ? "bg-primary text-primary-foreground"
                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
                   }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="border-t border-border p-3">
            {sidebarOpen && (
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-xs font-bold uppercase">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-foreground text-xs font-semibold truncate">{user?.name}</span>
                  <span className="text-muted-foreground text-xs truncate">{user?.email}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
            >
              <LogOut size={18} className="shrink-0" />
              {sidebarOpen && "Logout"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Top bar */}
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
            <h1 className="text-foreground font-semibold text-sm">B2 Sami Foods — Admin</h1>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </header>

          <main className="flex-1 p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  )
}
