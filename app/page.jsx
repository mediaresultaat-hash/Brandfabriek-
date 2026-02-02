"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) router.replace("/dashboard");
      })
      .catch(() => null);
  }, [router]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login failed");
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, setupCode })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Setup failed");
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="header">
        <div className="brand">
          <div className="brand-mark">BF</div>
          <div>
            <h1>Social Media Planner</h1>
            <div className="post-meta">Brandfabriek client review hub</div>
          </div>
        </div>
        <span className="badge">Client review enabled</span>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="section-title">{mode === "signin" ? "Sign in" : "Create admin"}</div>
        <p className="helper">
          {mode === "signin"
            ? "Use your username and password to access the planner."
            : "Create the first admin account using your setup code."}
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`button ${mode === "signin" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`button ${mode === "setup" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("setup")}
          >
            Create admin
          </button>
        </div>

        <form
          onSubmit={mode === "signin" ? handleLogin : handleSetup}
          style={{ marginTop: 20, display: "grid", gap: 14 }}
        >
          <label>
            <div className="label">Username</div>
            <input
              className="field"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            <div className="label">Password</div>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {mode === "setup" ? (
            <label>
              <div className="label">Setup code</div>
              <input
                className="field"
                value={setupCode}
                onChange={(event) => setSetupCode(event.target.value)}
                required
              />
            </label>
          ) : null}
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create admin"}
          </button>
        </form>
        {message ? <p className="helper" style={{ marginTop: 12 }}>{message}</p> : null}
      </div>
    </main>
  );
}
