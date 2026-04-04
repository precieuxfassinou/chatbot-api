import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include", // Include cookies for refresh token
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur de connexion");
      }
      localStorage.setItem("token", data.accessToken);
      navigation("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
        <h1>Connexion</h1>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
            </button>
        </form>
        <div className="auth-link">
            Pas encore de compte ? <a onClick={() => navigation('/register')} style={{cursor:'pointer'}}>S'inscrire</a>
        </div>
    </div>
);
}
