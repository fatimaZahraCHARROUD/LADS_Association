// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../Styles/login.css"
async function login(email, password) {
  const res = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  localStorage.setItem('token', data.access_token);

  return data;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);

      // redirect after login
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

 return (
    <div className="login-page">
      <div className="login-card">

        <h2>Welcome Back</h2>

        {/* NEW MESSAGE */}
        <p className="login-message">
          If you are a member, please login to access your dashboard.  
          Not a member yet?{" "}
          <span onClick={() => navigate("/membership")}>
            Join us here
          </span>
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>

          {error && <span className="error">{error}</span>}
        </form>
      </div>
    </div>
  );
}