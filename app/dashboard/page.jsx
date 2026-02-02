"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const statusOptions = [
  { value: "draft", label: "Concept" },
  { value: "review", label: "In review" },
  { value: "approved", label: "Goedgekeurd" },
  { value: "changes", label: "Aanpassen" }
];

const platformOptions = [
  "Instagram",
  "LinkedIn",
  "Facebook",
  "TikTok",
  "Pinterest",
  "X"
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    title: "",
    platform: "Instagram",
    scheduled_at: "",
    status: "review",
    copy: "",
    assets: "",
    media: [],
    client_id: ""
  });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [clientForm, setClientForm] = useState({ username: "", password: "" });
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.replace("/");
        return;
      }
      const payload = await response.json();
      if (mounted) {
        setUser(payload.user);
      }
      await Promise.all([fetchPosts(), fetchClients()]);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    const response = await fetch("/api/posts");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Kon posts niet laden.");
    } else {
      setPosts(payload.posts || []);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const response = await fetch("/api/clients");
    if (!response.ok) return;
    const payload = await response.json();
    setClients(payload.clients || []);
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      let mediaUrls = form.media || [];
      if (uploading) return;

      const fileInput = document.getElementById("media-input");
      const files = Array.from(fileInput?.files || []);
      if (files.length > 0) {
        setUploading(true);
        mediaUrls = [];
        for (const file of files) {
          const uploadRes = await fetch("/api/media/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type })
          });
          const uploadPayload = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadPayload.error || "Upload mislukt");

          const putRes = await fetch(uploadPayload.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file
          });
          if (!putRes.ok) throw new Error("Upload mislukt");

          mediaUrls.push(uploadPayload.publicUrl);
        }
      }

      const payload = {
        ...form,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        media: mediaUrls
      };

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Post kon niet worden aangemaakt");

      setForm({
        title: "",
        platform: "Instagram",
        scheduled_at: "",
        status: "review",
        copy: "",
        assets: "",
        media: [],
        client_id: ""
      });
      if (fileInput) fileInput.value = "";
      await fetchPosts();
    } catch (err) {
      setError(err.message || "Er ging iets mis.");
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (postId, status = "approved") => {
    const response = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Kon status niet wijzigen.");
      return;
    }

    await fetchPosts();
  };

  const handleAddComment = async (postId) => {
    const body = commentDrafts[postId]?.trim();
    if (!body) return;

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, body })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Kon reactie niet toevoegen.");
      return;
    }

    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    await fetchPosts();
  };

  const handleCreateClient = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const response = await fetch("/api/auth/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...clientForm, role: "client" })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Klant kon niet worden aangemaakt.");
      return;
    }

    setClientForm({ username: "", password: "" });
    setNotice("Klantaccount aangemaakt.");
  };

  const isVideo = (url) => /\.(mp4|mov|webm|m4v)$/i.test(url || "");

  const handleDeletePost = async (postId) => {
    if (!confirm("Weet je zeker dat je deze post wilt verwijderen?")) return;
    const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Post kon niet worden verwijderd.");
      return;
    }
    await fetchPosts();
  };

  const summary = useMemo(() => {
    const counts = { draft: 0, review: 0, approved: 0 };
    posts.forEach((post) => {
      counts[post.status] = (counts[post.status] || 0) + 1;
    });
    return counts;
  }, [posts]);

  return (
    <main>
      <div className="header">
        <div className="brand">
          <div className="brand-mark">BF</div>
          <div>
            <h1>Planner & Klantreview</h1>
            <div className="post-meta">Welkom {user?.username}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="badge">{summary.review} in review</span>
          <button className="button button-secondary" onClick={handleSignOut}>
            Uitloggen
          </button>
        </div>
      </div>

      <div className="split">
        {user?.role === "admin" ? (
          <section className="card">
            <div className="section-title">Nieuwe post</div>
            <form onSubmit={handleCreatePost} style={{ display: "grid", gap: 14 }}>
              <label>
                <div className="label">Titel</div>
                <input
                  className="field"
                  value={form.title}
                  onChange={(event) => handleFormChange("title", event.target.value)}
                  placeholder="Campagne highlight, productintro, etc."
                  required
                />
              </label>
              <label>
                <div className="label">Platform</div>
                <select
                  className="field"
                  value={form.platform}
                  onChange={(event) => handleFormChange("platform", event.target.value)}
                >
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="label">Klant</div>
                <select
                  className="field"
                  value={form.client_id}
                  onChange={(event) => handleFormChange("client_id", event.target.value)}
                  required
                >
                  <option value="">Selecteer klant</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.username}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="label">Geplande datum & tijd</div>
                <input
                  className="field"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(event) => handleFormChange("scheduled_at", event.target.value)}
                />
              </label>
              <label>
                <div className="label">Status</div>
                <select
                  className="field"
                  value={form.status}
                  onChange={(event) => handleFormChange("status", event.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="label">Copy</div>
                <textarea
                  className="field"
                  rows={5}
                  value={form.copy}
                  onChange={(event) => handleFormChange("copy", event.target.value)}
                  placeholder="Schrijf de caption, CTA en hashtags..."
                />
              </label>
              <label>
                <div className="label">Assets</div>
                <input
                  className="field"
                  value={form.assets}
                  onChange={(event) => handleFormChange("assets", event.target.value)}
                  placeholder="Links naar creatie, drive-mappen of notities"
                />
              </label>
              <label>
                <div className="label">Upload media</div>
                <input
                  id="media-input"
                  className="field"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                />
              </label>
              <button className="button button-primary" type="submit">
                {uploading ? "Bezig met uploaden..." : "Post toevoegen"}
              </button>
              {error ? <p className="helper">{error}</p> : null}
              {notice ? <p className="helper">{notice}</p> : null}
            </form>
          </section>
        ) : (
          <section className="card">
            <div className="section-title">Alleen review</div>
            <p className="helper">Je kunt reageren en posts goed- of afkeuren.</p>
          </section>
        )}

        <section>
          <div className="section-title">Reviewlijst</div>
          {loading ? (
            <div className="card">Posts laden...</div>
          ) : posts.length === 0 ? (
            <div className="card">Nog geen posts. Voeg de eerste toe.</div>
          ) : (
            <div className="grid">
              {posts.map((post) => (
                <div className="card post-card" key={post.id}>
                  <div className="post-header">
                    <div>
                      <div style={{ fontWeight: 600 }}>{post.title}</div>
                      <div className="post-meta">
                        {post.platform} · {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : "Niet gepland"}
                      </div>
                    </div>
                    <span
                      className={clsx("status", {
                        "status-draft": post.status === "draft",
                        "status-review": post.status === "review",
                        "status-approved": post.status === "approved",
                        "status-changes": post.status === "changes"
                      })}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.copy ? <div className="post-copy">{post.copy}</div> : null}
                  {post.assets ? (
                    <div className="post-meta">Assets: {post.assets}</div>
                  ) : null}
                  {post.media?.length ? (
                    <div className="media-grid">
                      {post.media.map((url) =>
                        isVideo(url) ? (
                          <video key={url} controls className="media-item">
                            <source src={url} />
                          </video>
                        ) : (
                          <img key={url} src={url} alt="Post media" className="media-item" />
                        )
                      )}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => handleApprove(post.id, "approved")}
                    >
                      Goedkeuren
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => handleApprove(post.id, "changes")}
                    >
                      Afkeuren
                    </button>
                    {user?.role === "admin" ? (
                      <button
                        className="button button-ghost"
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Verwijderen
                      </button>
                    ) : null}
                    <span className="helper">{post.comments?.length || 0} reacties</span>
                  </div>

                  {post.comments?.length ? (
                    <div className="comment-list">
                      {post.comments.map((comment) => (
                        <div className="comment-item" key={comment.id}>
                          <div style={{ fontWeight: 600 }}>{comment.author_username || "Client"}</div>
                          <div>{comment.body}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div>
                    <div className="label">Reactie toevoegen</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="field"
                        value={commentDrafts[post.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))
                        }
                        placeholder="Feedback, wijzigingen of akkoord"
                      />
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                      >
                        Versturen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {user?.role === "admin" ? (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="section-title">Klantaccount aanmaken</div>
          <form onSubmit={handleCreateClient} style={{ display: "grid", gap: 14, maxWidth: 420 }}>
            <label>
              <div className="label">Klant gebruikersnaam</div>
              <input
                className="field"
                value={clientForm.username}
                onChange={(event) => setClientForm((prev) => ({ ...prev, username: event.target.value }))}
                required
              />
            </label>
            <label>
              <div className="label">Tijdelijk wachtwoord</div>
              <input
                className="field"
                type="password"
                value={clientForm.password}
                onChange={(event) => setClientForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </label>
            <button className="button button-secondary" type="submit">
              Klant aanmaken
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
