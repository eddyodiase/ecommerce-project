import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

export function ProfilePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(
    user || JSON.parse(localStorage.getItem("authUser") || "null")
  );
  const currentUser = user || profileUser;
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setProfileUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("authToken");

    axios
      .get("/api/orders?expand=products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setOrders(response.data || []);
      })
      .catch((requestError) => {
        console.error("Error loading profile orders:", requestError);
      });
  }, [currentUser, navigate]);

  useEffect(() => {
    setFormData({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    });
  }, [currentUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("authToken");
    setError("");
    setIsSaving(true);

    try {
      const response = await axios.put(
        "/api/profile",
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUser = response.data?.user || { ...currentUser, ...formData };
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      setProfileUser(updatedUser);
      setFormData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update account.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    onLogout?.();
    navigate("/");
  };

  if (!currentUser) {
    return null;
  }

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (Number(order.totalCostCents) || 0), 0);

  return (
    <main className="profile-shell">
      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{currentUser.name?.charAt(0)?.toUpperCase() || "U"}</div>
          <div>
            <p className="profile-label">Account</p>
            <h2>{currentUser.name || "Customer"}</h2>
          </div>
        </div>

        <div className="profile-overview">
          <div className="overview-stat">
            <span className="overview-label">Orders</span>
            <strong>{totalOrders}</strong>
          </div>
          <div className="overview-stat">
            <span className="overview-label">Total spent</span>
            <strong>${(totalSpent / 100).toFixed(2)}</strong>
          </div>
        </div>

        <div className="profile-section">
          <h3>Account details</h3>
          <div className="profile-form">
            <div className="form-field">
              <label htmlFor="profile-name">Full name</label>
              <input id="profile-name" name="name" value={formData.name} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>

            {error ? <div className="auth-alert" role="alert">{error}</div> : null}

            <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="profile-section">
          <h3>Recent orders</h3>
          {orders.length === 0 ? (
            <p className="empty-state">No orders yet.</p>
          ) : (
            <>
              <p className="order-summary-count">
                {orders.length} order{orders.length === 1 ? "" : "s"}
              </p>
              <div className="order-summary-list">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="order-summary-item">
                    <div>
                      <span className="order-summary-label">Order</span>
                      <strong>#{String(order.id).slice(0, 8)}</strong>
                    </div>
                    <div>
                      <span className="order-summary-label">Items</span>
                      <strong>{order.products?.length || 0}</strong>
                    </div>
                    <div>
                      <span className="order-summary-label">Total</span>
                      <strong>${((order.totalCostCents || 0) / 100).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="profile-actions">
          <button type="button" className="primary-button" onClick={() => navigate("/")}>
            Continue shopping
          </button>
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
