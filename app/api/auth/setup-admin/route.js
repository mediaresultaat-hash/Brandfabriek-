import bcrypt from "bcryptjs";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { createSessionToken, setSessionCookie } from "../../../../lib/auth";

export async function POST(request) {
  const { username, password, setupCode } = await request.json();
  const expectedCode = process.env.ADMIN_SETUP_CODE;

  if (!expectedCode || setupCode !== expectedCode) {
    return Response.json({ error: "Invalid setup code" }, { status: 403 });
  }

  const { data: existingAdmin } = await supabaseServer
    .from("app_users")
    .select("id")
    .eq("role", "admin")
    .maybeSingle();

  if (existingAdmin) {
    return Response.json({ error: "Admin already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabaseServer
    .from("app_users")
    .insert({ username, password_hash: passwordHash, role: "admin" })
    .select("id,username,role")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const token = createSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await supabaseServer.from("sessions").insert({
    token,
    user_id: user.id,
    expires_at: expiresAt.toISOString()
  });

  setSessionCookie(token);
  return Response.json({ ok: true, user });
}
