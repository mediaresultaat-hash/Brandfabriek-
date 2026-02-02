import { getSessionUser } from "../../../../lib/auth";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(request, { params }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { error } = await supabaseServer
    .from("posts")
    .update({ status: payload.status })
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
