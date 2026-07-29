import { useState ,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "../../Styles/login.css";

async function login(email, password) {
  const res = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  localStorage.setItem("token", data.access_token);

  return data;
}

export default function Login() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);

      navigate("/admin");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h2>{t("login.title")}</h2>

        <p className="login-message">
          {t("login.message")}{" "}
          <span onClick={() => navigate("/membership")}>
            {t("login.join_link")}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="login-form">

          <input
            type="email"
            placeholder={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {t("login.button")}
          </button>

          {error && (
            <span className="error">
              {error}
            </span>
          )}

        </form>

      </div>
    </div>
  );
}