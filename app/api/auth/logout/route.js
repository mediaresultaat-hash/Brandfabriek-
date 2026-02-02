import { supabaseServer } from "../../../../lib/supabaseServer";
import { clearSessionCookie } from "../../../../lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const token = cookies().get("bf_session")?.value;
  if (token) {
    await supabaseServer.from("sessions").delete().eq("token", token);
  }
  clearSessionCookie();
  return Response.json({ ok: true });
}
