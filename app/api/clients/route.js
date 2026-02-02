import { getSessionUser } from "../../../lib/auth";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabaseServer
    .from("app_users")
    .select("id,username,role")
    .eq("role", "client")
    .order("username", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ clients: data || [] });
}
