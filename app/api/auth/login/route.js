import bcrypt from "bcryptjs";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { createSessionToken, setSessionCookie } from "../../../../lib/auth";

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ error: "Missing credentials" }, { status: 400 });
  }

  const { data: user, error } = await supabaseServer
    .from("app_users")
    .select("id,username,password_hash,role")
    .eq("username", username)
    .maybeSingle();

  if (error || !user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error: insertError } = await supabaseServer.from("sessions").insert({
    token,
    user_id: user.id,
    expires_at: expiresAt.toISOString()
  });

  if (insertError) {
    return Response.json({ error: "Could not start session" }, { status: 500 });
  }

  setSessionCookie(token);
  return Response.json({ ok: true, role: user.role, username: user.username });
}
