"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data?.session) {
        router.replace("/dashboard");
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setMessage("Account created. Check your inbox if email confirmation is enabled.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        router.replace("/dashboard");
      }
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
        <div className="section-title">{mode === "signin" ? "Sign in" : "Create account"}</div>
        <p className="helper">
          {mode === "signin"
            ? "Use your email and password to access the planner."
            : "Create the first account for you and your client."}
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
            className={`button ${mode === "signup" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "grid", gap: 14 }}>
          <label>
            <div className="label">Email</div>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        {message ? <p className="helper" style={{ marginTop: 12 }}>{message}</p> : null}
      </div>
    </main>
  );
}
