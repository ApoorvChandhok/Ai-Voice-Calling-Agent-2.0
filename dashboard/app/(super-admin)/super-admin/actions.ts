"use server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function setImpersonationCookie(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();

  if (profile?.role !== 'super_admin') throw new Error("Forbidden");

  const cookieStore = await cookies();
  cookieStore.set("active_workspace_id", workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearImpersonationCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("active_workspace_id");
}
