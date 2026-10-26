import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../auth/Auth.css";

export function RegisterPage({ onRegister }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
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
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      if (onRegister) {
        onRegister(user, token);
      }

      navigate("/");
    } catch (requestError) {
      setError("Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <header className="auth-header">
          <h2>Create account</h2>
          <p>Start shopping with your own profile</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          {error ? <div className="auth-alert" role="alert">{error}</div> : null}

          <button className="auth-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          <div className="auth-link-box">
            <Link className="auth-link" to="/login">Already have an account? Sign in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
