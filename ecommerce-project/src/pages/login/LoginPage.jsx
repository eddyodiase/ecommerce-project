import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../auth/Auth.css";

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
    } catch (requestError) {
      setError("Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <header className="auth-header">
          <h2>Sign in</h2>
          <p>Welcome back</p>
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
