"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "approved", label: "Approved" }
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
      setError(payload.error || "Could not load posts.");
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
          if (!uploadRes.ok) throw new Error(uploadPayload.error || "Upload failed");

          const putRes = await fetch(uploadPayload.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file
          });
          if (!putRes.ok) throw new Error("Upload failed");

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
      if (!response.ok) throw new Error(data.error || "Could not create post");

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
      setError(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (postId) => {
    const response = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Could not approve.");
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
      setError(payload.error || "Could not add comment.");
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
      setError(payload.error || "Could not create client.");
      return;
    }

    setClientForm({ username: "", password: "" });
    setNotice("Client account created.");
  };

  const isVideo = (url) => /\.(mp4|mov|webm|m4v)$/i.test(url || "");

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
            <h1>Planner & Client Review</h1>
            <div className="post-meta">Welcome {user?.username}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="badge">{summary.review} waiting review</span>
          <button className="button button-secondary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="split">
        {user?.role === "admin" ? (
          <section className="card">
            <div className="section-title">Create a new post</div>
            <form onSubmit={handleCreatePost} style={{ display: "grid", gap: 14 }}>
              <label>
                <div className="label">Title</div>
                <input
                  className="field"
                  value={form.title}
                  onChange={(event) => handleFormChange("title", event.target.value)}
                  placeholder="Campaign highlight, product intro, etc."
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
                <div className="label">Client</div>
                <select
                  className="field"
                  value={form.client_id}
                  onChange={(event) => handleFormChange("client_id", event.target.value)}
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.username}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="label">Scheduled date & time</div>
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
                  placeholder="Write the caption, CTA, and hashtags..."
                />
              </label>
              <label>
                <div className="label">Assets</div>
                <input
                  className="field"
                  value={form.assets}
                  onChange={(event) => handleFormChange("assets", event.target.value)}
                  placeholder="Links to creative, drive folders, or notes"
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
                {uploading ? "Uploading..." : "Add post to review"}
              </button>
              {error ? <p className="helper">{error}</p> : null}
              {notice ? <p className="helper">{notice}</p> : null}
            </form>
          </section>
        ) : (
          <section className="card">
            <div className="section-title">Review only</div>
            <p className="helper">You can comment and approve assigned posts here.</p>
          </section>
        )}

        <section>
          <div className="section-title">Review queue</div>
          {loading ? (
            <div className="card">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="card">No posts yet. Add the first one.</div>
          ) : (
            <div className="grid">
              {posts.map((post) => (
                <div className="card post-card" key={post.id}>
                  <div className="post-header">
                    <div>
                      <div style={{ fontWeight: 600 }}>{post.title}</div>
                      <div className="post-meta">
                        {post.platform} · {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : "Unscheduled"}
                      </div>
                    </div>
                    <span
                      className={clsx("status", {
                        "status-draft": post.status === "draft",
                        "status-review": post.status === "review",
                        "status-approved": post.status === "approved"
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
                      onClick={() => handleApprove(post.id)}
                    >
                      Approve
                    </button>
                    <span className="helper">{post.comments?.length || 0} comments</span>
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
                    <div className="label">Add comment</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="field"
                        value={commentDrafts[post.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))
                        }
                        placeholder="Client feedback, edits, or approvals"
                      />
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                      >
                        Send
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
          <div className="section-title">Create client login</div>
          <form onSubmit={handleCreateClient} style={{ display: "grid", gap: 14, maxWidth: 420 }}>
            <label>
              <div className="label">Client username</div>
              <input
                className="field"
                value={clientForm.username}
                onChange={(event) => setClientForm((prev) => ({ ...prev, username: event.target.value }))}
                required
              />
            </label>
            <label>
              <div className="label">Temporary password</div>
              <input
                className="field"
                type="password"
                value={clientForm.password}
                onChange={(event) => setClientForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </label>
            <button className="button button-secondary" type="submit">
              Create client
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
