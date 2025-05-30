import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Supabase } from "../config/supabase-config";

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("ganttUser");
    if (storedUser) {
      const { role } = JSON.parse(storedUser);
      redirectToDashboard(role);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const redirectToDashboard = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "user") navigate("/user");
    else if (role === "subadmin") navigate("/subadmin");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    const { username, password, role } = formData;
  
    try {
      const { data, error } = await Supabase
        .from("gantt")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .eq("role", role)
        .eq("status", "active")
        .single();
  
      if (error || !data) {
        setError("Invalid credentials or role mismatch.");
        setLoading(false);
        return;
      }
  
      // Store full user data in localStorage, including fullname
      localStorage.setItem(
        "ganttUser",
        JSON.stringify({
          username: data.username,
          role: data.role,
          user_id:data.id,
          fullname: data.fullname, // retrieved from Supabase
        })
      );
  
      redirectToDashboard(data.role);
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };
  

  

  return (
    <div className="body">
      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="login-wrapper"
        >
          <div className="card">
            <div className="card-content">
              <h2 className="card-title">Welcome Back</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Alice"
                    className="form-input"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="form-input"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role" className="form-label">Role</label>
                  <select
                    id="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="subadmin">Sub Admin</option>
                  </select>
                </div>

                {error && (
                  <p className="error-message" style={{ color: "red", marginTop: "10px" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="submit-button"
                  style={{
                    marginTop: "16px",
                    minWidth: "120px",
                    padding: "10px",
                    backgroundColor: "#333",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
