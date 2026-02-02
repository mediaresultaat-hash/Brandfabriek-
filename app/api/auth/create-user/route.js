import bcrypt from "bcryptjs";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { getSessionUser } from "../../../../lib/auth";

export async function POST(request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { username, password, role } = await request.json();
  if (!username || !password || !role) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabaseServer.from("app_users").insert({
    username,
    password_hash: passwordHash,
    role
  }).select("id,username,role").maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ user: data });
}
