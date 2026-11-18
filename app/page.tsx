import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/dashboard/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getConversationSummaries } from "@/lib/services/conversations";

export default function Home() {
  return (
    <Suspense fallback={<main className="auth-page">Memuat sesi...</main>}>
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  await connection();

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (!user) redirect("/login");

  const metadata = user.user_metadata;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  const conversationResult = await getConversationSummaries(supabase, user.id);
  if (!conversationResult.ok) throw new Error(conversationResult.error);
  const displayName =
    profile?.full_name?.trim() ||
    (typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name
      : user.email ?? "Pengguna");
  const username = profile?.username ??
    (typeof metadata.username === "string" ? metadata.username : "");
  const avatarUrl =
    profile?.avatar_url ??
    (typeof metadata.avatar_url === "string" ? metadata.avatar_url : null);

  return (
    <AppShell
      userId={user.id}
      initialConversations={conversationResult.data}
      displayName={displayName}
      username={username}
      avatarUrl={avatarUrl}
    />
  );
}
