"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { supabase } from "../../lib/supabaseClient";

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
  const [form, setForm] = useState({
    title: "",
    platform: "Instagram",
    scheduled_at: "",
    status: "review",
    copy: "",
    assets: ""
  });
  const [commentDrafts, setCommentDrafts] = useState({});

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace("/");
        return;
      }
      if (mounted) {
        setUser(data.session.user);
      }
      await fetchPosts();
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/");
      }
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [router]);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("id,title,platform,scheduled_at,status,copy,assets,created_at,comments(id,body,author_email,created_at)")
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      author_email: user?.email || ""
    };

    const { error: insertError } = await supabase.from("posts").insert(payload);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm({
      title: "",
      platform: "Instagram",
      scheduled_at: "",
      status: "review",
      copy: "",
      assets: ""
    });
    await fetchPosts();
  };

  const handleApprove = async (postId) => {
    const { error: updateError } = await supabase
      .from("posts")
      .update({ status: "approved" })
      .eq("id", postId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await fetchPosts();
  };

  const handleAddComment = async (postId) => {
    const body = commentDrafts[postId]?.trim();
    if (!body) return;

    const { error: commentError } = await supabase.from("comments").insert({
      post_id: postId,
      body,
      author_email: user?.email || ""
    });

    if (commentError) {
      setError(commentError.message);
      return;
    }

    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
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
            <h1>Planner & Client Review</h1>
            <div className="post-meta">Welcome {user?.email}</div>
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
            <button className="button button-primary" type="submit">
              Add post to review
            </button>
            {error ? <p className="helper">{error}</p> : null}
          </form>
        </section>

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

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button className="button button-secondary" type="button" onClick={() => handleApprove(post.id)}>
                      Approve
                    </button>
                    <span className="helper">{post.comments?.length || 0} comments</span>
                  </div>

                  {post.comments?.length ? (
                    <div className="comment-list">
                      {post.comments.map((comment) => (
                        <div className="comment-item" key={comment.id}>
                          <div style={{ fontWeight: 600 }}>{comment.author_email || "Client"}</div>
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
    </main>
  );
}
