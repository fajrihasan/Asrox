import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatConversation, ChatKind, ChatParticipant, GroupRole } from "@/lib/chat-types";
import type { Database } from "@/lib/supabase/database.types";

type ConversationClient = SupabaseClient<Database>;
type ConversationSummaryResult =
  | { ok: true; data: ChatConversation[] }
  | { ok: false; error: string };

function isGroupRole(role?: string): role is GroupRole {
  return role === "owner" || role === "admin" || role === "member";
}

function formatConversationTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export async function getConversationSummaries(
  supabase: ConversationClient,
  userId: string,
): Promise<ConversationSummaryResult> {
  const { data: memberships, error: membershipsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, role")
    .eq("user_id", userId);

  if (membershipsError) {
    return { ok: false, error: "Daftar percakapan belum dapat dimuat." };
  }
  const conversationIds = memberships.map((membership) => membership.conversation_id);
  if (conversationIds.length === 0) return { ok: true, data: [] };

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, type, name, avatar_url, updated_at, conversation_participants(user_id, role, profiles(id, username, full_name, avatar_url, bio)), messages(id, content, created_at, sender_id, deleted_at)",
    )
    .in("id", conversationIds)
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .order("updated_at", { ascending: false });

  if (error) return { ok: false, error: "Daftar percakapan belum dapat dimuat." };

  const summaries = data.map((conversation) => {
    const participants = conversation.conversation_participants;
    const counterpart = participants.find((participant) => participant.user_id !== userId);
    const profile = counterpart?.profiles;
    const lastMessage = conversation.messages[0];
    const kind: ChatKind = conversation.type === "group" ? "group" : "personal";
    const chatParticipants: ChatParticipant[] = participants.flatMap((participant) => {
      const participantProfile = participant.profiles;
      if (!participantProfile || !isGroupRole(participant.role)) return [];

      return [{
        id: participantProfile.id,
        name: participantProfile.full_name ?? participantProfile.username,
        username: participantProfile.username,
        avatar: participantProfile.avatar_url ?? "",
        bio: participantProfile.bio ?? undefined,
        role: participant.role,
      }];
    });
    const lastMessageAuthor =
      lastMessage?.sender_id === userId
        ? "Kamu"
        : participants.find((participant) => participant.user_id === lastMessage?.sender_id)
            ?.profiles?.full_name ??
          participants.find((participant) => participant.user_id === lastMessage?.sender_id)
            ?.profiles?.username ??
          "Anggota";
    const preview = lastMessage
      ? lastMessage.deleted_at
        ? "Pesan dihapus"
        : kind === "group"
          ? `${lastMessageAuthor}: ${lastMessage.content}`
          : lastMessage.content
      : "Belum ada pesan";

    const role = memberships.find(
      (membership) => membership.conversation_id === conversation.id,
    )?.role;

    return {
      id: conversation.id,
      peerId: kind === "personal" ? counterpart?.user_id : undefined,
      kind,
      name: kind === "group"
        ? conversation.name ?? "Grup tanpa nama"
        : profile?.full_name ?? profile?.username ?? "Pengguna",
      username: kind === "personal" ? profile?.username ?? undefined : undefined,
      avatar: kind === "group"
        ? conversation.avatar_url ?? ""
        : profile?.avatar_url ?? "",
      preview,
      time: formatConversationTime(lastMessage?.created_at ?? conversation.updated_at),
      unread: 0,
      members: kind === "group" ? participants.length : undefined,
      currentUserRole: isGroupRole(role) ? role : undefined,
      bio: kind === "personal" ? profile?.bio ?? undefined : undefined,
      participants: kind === "group" ? chatParticipants : undefined,
      messages: [],
    };
  });

  const activityById = new Map(
    data.map((conversation) => [
      conversation.id,
      conversation.messages[0]?.created_at ?? conversation.updated_at,
    ]),
  );
  summaries.sort((left, right) =>
    (activityById.get(right.id) ?? "").localeCompare(activityById.get(left.id) ?? ""),
  );

  return { ok: true, data: summaries };
}
