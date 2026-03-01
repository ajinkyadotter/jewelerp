"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@kanakam.in")
  const [password, setPassword] = useState("Admin@1234")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login failed")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f3f4f6" }}>
      <div style={{ background: "white", padding: "2rem", borderRadius: "8px", width: "360px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h1 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: "bold" }}>JewelERP Login</h1>
        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "10px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  )
}
