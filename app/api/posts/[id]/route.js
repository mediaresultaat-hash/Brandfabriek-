import { getSessionUser } from "../../../../lib/auth";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(request, { params }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { data: post, error: fetchError } = await supabaseServer
    .from("posts")
    .select("id,client_id")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  if (sessionUser.role === "client" && post.client_id !== sessionUser.id) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error } = await supabaseServer
    .from("posts")
    .update({ status: payload.status })
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
