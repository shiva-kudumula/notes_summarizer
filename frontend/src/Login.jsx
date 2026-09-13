import { useState } from "react";
import "./Login.css";
import { api } from "./api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [mode, setMode] = useState("login"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault(); setError(""); setLoading(true);
    try { const data = await api(mode === "signup" ? "/auth/signup" : "/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); if (mode === "login") { localStorage.setItem("token", data.token); onLogin(); } else { setMode("login"); setError("Account created. Please log in."); } } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  return <div className="login-page"><div className="login-card"><h1 className="login-title">NotesGenie</h1><p className="login-subtitle">Add a source, understand it, then test yourself.</p><div className="toggle-container"><button type="button" className={`toggle-btn ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Login</button><button type="button" className={`toggle-btn ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Sign up</button></div><form onSubmit={handleSubmit}><div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength="6" required /></div>{error && <p className="error-text">{error}</p>}<button className="submit-btn" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Login" : "Create account"}</button></form></div></div>;
}
