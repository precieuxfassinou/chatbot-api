import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        credentials: "include", // Include cookies for refresh token
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      localStorage.setItem('token', data.accessToken);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
        <h2>Créer un compte</h2>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
            <input type="text" name="firstname" placeholder="Prénom" value={formData.firstname} onChange={handleChange} required />
            <input type="text" name="lastname" placeholder="Nom" value={formData.lastname} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required />
            <button type="submit">S'inscrire</button>
        </form>
        <div className="auth-link">
            Déjà un compte ? <a onClick={() => navigate('/login')} style={{cursor:'pointer'}}>Se connecter</a>
        </div>
    </div>
);
}
