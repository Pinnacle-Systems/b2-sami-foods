import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Sun, Moon } from "lucide-react"
import { useLoginMutation } from "../../redux/services/authApi"
import { setCredentials, selectIsAdmin, selectIsAuthenticated } from "../../redux/features/authSlice"
import { useAppDispatch, useAppSelector } from "../../redux/Dispatch/useAppDispatch"
import { useAdminTheme } from "../../hooks/useAdminTheme"

export default function AdminLogin() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAdmin = useAppSelector(selectIsAdmin)
  const [loginUser, { isLoading }] = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const { isDark, toggle } = useAdminTheme()

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate("/admin/dashboard", { replace: true })
    }
  }, [isAuthenticated, isAdmin, navigate])

  if (isAuthenticated && isAdmin) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError("All fields are required"); return }
    setError("")
    try {
      const result = await loginUser({ email: form.email, password: form.password }).unwrap()
      if (result.user.role !== "admin") {
        setError("Access denied. This account does not have admin privileges.")
        return
      }
      dispatch(setCredentials({ user: result.user, token: result.token }))
      navigate("/admin/dashboard")
    } catch (err) {
      setError(err?.data?.message || "Invalid credentials")
    }
  }

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError("")
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="absolute top-4 right-4 p-2 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
                <ShieldCheck size={28} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
              <p className="text-muted-foreground text-sm mt-1">Sign in with your admin credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="flex items-center gap-2 bg-muted border border-input rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                  <Mail size={17} className="text-muted-foreground shrink-0" />
                  <input
                    id="admin-email" name="email" type="email" autoComplete="email"
                    placeholder="admin@example.com" value={form.email} onChange={handleChange}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="flex items-center gap-2 bg-muted border border-input rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                  <Lock size={17} className="text-muted-foreground shrink-0" />
                  <input
                    id="admin-password" name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password" placeholder="••••••••"
                    value={form.password} onChange={handleChange}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="mt-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {isLoading
                  ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  : <><ShieldCheck size={17} /> Sign in to Admin</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
