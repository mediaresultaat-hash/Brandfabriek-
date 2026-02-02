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
      if (!response.ok) throw new Error(payload.error || "Inloggen mislukt");
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error.message || "Er ging iets mis.");
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
      if (!response.ok) throw new Error(payload.error || "Setup mislukt");
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error.message || "Er ging iets mis.");
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
            <div className="post-meta">Brandfabriek reviewportaal</div>
          </div>
        </div>
        <span className="badge">Client review enabled</span>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="section-title">{mode === "signin" ? "Inloggen" : "Admin aanmaken"}</div>
        <p className="helper">
          {mode === "signin"
            ? "Gebruik je gebruikersnaam en wachtwoord."
            : "Maak het eerste admin account aan met je setupcode."}
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`button ${mode === "signin" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("signin")}
          >
            Inloggen
          </button>
          <button
            type="button"
            className={`button ${mode === "setup" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("setup")}
          >
            Admin aanmaken
          </button>
        </div>

        <form
          onSubmit={mode === "signin" ? handleLogin : handleSetup}
          style={{ marginTop: 20, display: "grid", gap: 14 }}
        >
          <label>
            <div className="label">Gebruikersnaam</div>
            <input
              className="field"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            <div className="label">Wachtwoord</div>
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
              <div className="label">Setupcode</div>
              <input
                className="field"
                value={setupCode}
                onChange={(event) => setSetupCode(event.target.value)}
                required
              />
            </label>
          ) : null}
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? "Bezig..." : mode === "signin" ? "Inloggen" : "Admin aanmaken"}
          </button>
        </form>
        {message ? <p className="helper" style={{ marginTop: 12 }}>{message}</p> : null}
      </div>
    </main>
  );
}
