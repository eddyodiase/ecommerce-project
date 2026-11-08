import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "../../components/BrandMark";
import "../auth/Auth.css";
import "./LoginPage.css";

const ADMIN_LOGIN_EMAIL = "eddyodiase@yahoo.com";

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (formData.email.trim().toLowerCase() === ADMIN_LOGIN_EMAIL) {
        const response = await axios.post("/api/admin/login", {
          email: formData.email.trim(),
          password: formData.password,
        });
        sessionStorage.setItem("adminApiKey", response.data.adminApiKey);

        const user = {
          id: `admin-${Date.now()}`,
          name: "Admin",
          email: ADMIN_LOGIN_EMAIL,
        };
        onLogin?.(user, `admin-session-${Date.now()}`);
        navigate("/admin");
        return;
      }

      const token = `local-${Date.now()}`;
      const user = {
        id: `user-${Date.now()}`,
        name: formData.email.trim().split("@")[0] || "Customer",
        email: formData.email.trim(),
      };

      if (onLogin) {
        onLogin(user, token);
      }

      navigate("/");
    } catch (loginError) {
      setError(
        loginError.response?.status === 401
          ? "Invalid admin email or password."
          : "Unable to sign in right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell login-shell">
      <section className="auth-card">
        <header className="auth-header">
          <Link className="login-brand" to="/">
            <BrandMark className="login-brand-mark" />
            <span>Zambba</span>
          </Link>
          <h1>Sign in</h1>
          <p>Welcome back to Zambba</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error ? <div className="auth-alert" role="alert">{error}</div> : null}

          <button className="auth-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="auth-link-box">
            <Link className="auth-link" to="/register">
              Need an account? Create one
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
