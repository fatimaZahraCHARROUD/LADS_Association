import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // simple fake admin check
    if (password === "123") {
      navigate("/admin");
    } else {
      setError("Wrong password");
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "100px auto" }}>
      <h2>Admin Login</h2>

      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@email.com"
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </div>

        {error && (
          <p style={{ color: "red", fontSize: "12px" }}>{error}</p>
        )}

        <button type="submit" style={{ marginTop: "15px" }}>
          Login
        </button>
      </form>
    </div>
  );
}