import { getSessionUser } from "../../../lib/auth";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = supabaseServer
    .from("posts")
    .select("id,title,platform,scheduled_at,status,copy,assets,media,created_at,client_id,comments(id,body,author_username,created_at)")
    .order("scheduled_at", { ascending: true });

  if (sessionUser.role === "client") {
    query.eq("client_id", sessionUser.id);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ posts: data || [] });
}

export async function POST(request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  const { error } = await supabaseServer.from("posts").insert({
    title: payload.title,
    platform: payload.platform,
    scheduled_at: payload.scheduled_at,
    status: payload.status,
    copy: payload.copy,
    assets: payload.assets,
    media: payload.media || [],
    client_id: payload.client_id || null,
    author_username: sessionUser.username
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
