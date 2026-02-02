import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseServer } from "./supabaseServer";

const SESSION_COOKIE = "bf_session";

export const createSessionToken = () => crypto.randomUUID();

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data: session, error } = await supabaseServer
    .from("sessions")
    .select("token,expires_at,app_users(id,username,role)")
    .eq("token", token)
    .maybeSingle();

  if (error || !session?.app_users) return null;

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    await supabaseServer.from("sessions").delete().eq("token", token);
    return null;
  }

  return {
    id: session.app_users.id,
    username: session.app_users.username,
    role: session.app_users.role
  };
}

export function setSessionCookie(token) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0
  });
}
