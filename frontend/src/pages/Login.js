import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import styles from "../styles/Login.module.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      // Correct extraction: role is at top level, username is in user object
      let role = res.data.role;
      const userName = res.data.user.name;
      
      role = role ? role.toUpperCase() : "";
      console.log("ROLE:", role);

      localStorage.setItem("username", userName);
      localStorage.setItem("userRole", role);

      if (role === "ADMIN") {
        navigate("/admin");
      } else if (role === "EMPLOYEE") {
        navigate("/employee");
      } else if (role === "HR") {
        navigate("/hr");
      } else if (role === "MANAGER") {
        navigate("/manager");
      } else {
        navigate("/");
      }

    } catch (err) {
      // Handle standardized error response
      const errorMsg = err.response?.data?.detail || "Login Failed: Invalid credentials";
      console.log("Error:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>Log in using your email address</p>
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;