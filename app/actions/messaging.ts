"use server";

import { z } from "zod";
import type { ChatConversation, ChatMessage, Person } from "@/lib/chat-types";
import { getConversationSummaries } from "@/lib/services/conversations";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();
const messageSchema = z.string().trim().min(1).max(4000);
const groupNameSchema = z.string().trim().min(1).max(80);

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function searchUsersAction(query: string): Promise<ActionResult<Person[]>> {
  const username = query.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_]{2,24}$/.test(username)) return { ok: true, data: [] };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio")
    .ilike("username", `${username}%`)
    .neq("id", user.id)
    .limit(10);

  if (error) return { ok: false, error: "Pencarian pengguna belum dapat dilakukan." };

  return {
    ok: true,
    data: data.map((profile) => ({
      id: profile.id,
      name: profile.full_name ?? profile.username,
      username: profile.username,
      avatar: profile.avatar_url ?? "",
      online: false,
      bio: profile.bio ?? undefined,
    })),
  };
}

export async function loadConversationsAction(): Promise<ActionResult<ChatConversation[]>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  return getConversationSummaries(supabase, user.id);
}

export async function openDirectConversationAction(
  targetUserId: string,
): Promise<ActionResult<string>> {
  if (!uuidSchema.safeParse(targetUserId).success) {
    return { ok: false, error: "Pengguna yang dipilih tidak valid." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };
  if (targetUserId === user.id) return { ok: false, error: "Kamu tidak dapat memulai chat dengan akun sendiri." };

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetError || !target) return { ok: false, error: "Pengguna tidak ditemukan." };

  const { data: memberships, error: membershipsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (membershipsError) return { ok: false, error: "Percakapan belum dapat dibuka." };

  const conversationIds = memberships.map((membership) => membership.conversation_id);
  if (conversationIds.length > 0) {
    const { data: directChats, error: directChatsError } = await supabase
      .from("conversations")
      .select("id, conversation_participants(user_id)")
      .eq("type", "direct")
      .in("id", conversationIds);

    if (directChatsError) return { ok: false, error: "Percakapan belum dapat dibuka." };

    const existing = directChats.find((conversation) =>
      conversation.conversation_participants.some(
        (participant) => participant.user_id === targetUserId,
      ),
    );

    if (existing) return { ok: true, data: existing.id };
  }

  const { data: conversationId, error: createError } = await supabase.rpc(
    "create_conversation",
    { conversation_type: "direct" },
  );

  if (createError || !conversationId) {
    return { ok: false, error: "Percakapan belum dapat dibuat." };
  }

  const { error: participantError } = await supabase.rpc(
    "add_conversation_participant",
    {
      target_conversation_id: conversationId,
      target_user_id: targetUserId,
    },
  );

  if (participantError) {
    return {
      ok: false,
      error: "Ruang percakapan dibuat, tetapi pengguna belum dapat ditambahkan.",
    };
  }

  return { ok: true, data: conversationId };
}

export async function createGroupAction(
  name: string,
  memberIds: string[],
): Promise<ActionResult<string>> {
  const validName = groupNameSchema.safeParse(name);
  const validMembers = z.array(uuidSchema).max(100).safeParse(memberIds);
  if (!validName.success || !validMembers.success) {
    return { ok: false, error: "Nama grup atau daftar anggota tidak valid." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const uniqueMemberIds = [...new Set(validMembers.data)].filter((id) => id !== user.id);
  const { data: conversationId, error: createError } = await supabase.rpc(
    "create_conversation",
    { conversation_type: "group", conversation_name: validName.data },
  );

  if (createError || !conversationId) return { ok: false, error: "Grup belum dapat dibuat." };

  for (const memberId of uniqueMemberIds) {
    const { error } = await supabase.rpc("add_conversation_participant", {
      target_conversation_id: conversationId,
      target_user_id: memberId,
    });

    if (error) {
      return {
        ok: false,
        error: "Grup dibuat, tetapi sebagian anggota belum dapat ditambahkan.",
      };
    }
  }

  return { ok: true, data: conversationId };
}

export async function addConversationParticipantsAction(
  conversationId: string,
  memberIds: string[],
): Promise<ActionResult<undefined>> {
  if (!uuidSchema.safeParse(conversationId).success) {
    return { ok: false, error: "Percakapan yang dipilih tidak valid." };
  }
  const validMembers = z.array(uuidSchema).max(100).safeParse(memberIds);
  if (!validMembers.success) return { ok: false, error: "Daftar anggota tidak valid." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const uniqueMemberIds = [...new Set(validMembers.data)].filter((id) => id !== user.id);
  for (const memberId of uniqueMemberIds) {
    const { error } = await supabase.rpc("add_conversation_participant", {
      target_conversation_id: conversationId,
      target_user_id: memberId,
    });

    if (error) return { ok: false, error: "Sebagian anggota belum dapat ditambahkan." };
  }

  return { ok: true, data: undefined };
}

export async function sendMessageAction(
  conversationId: string,
  content: string,
): Promise<ActionResult<ChatMessage>> {
  if (!uuidSchema.safeParse(conversationId).success) {
    return { ok: false, error: "Percakapan yang dipilih tidak valid." };
  }
  const validContent = messageSchema.safeParse(content);
  if (!validContent.success) return { ok: false, error: "Pesan harus berisi 1–4000 karakter." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: validContent.data,
      message_type: "text",
    })
    .select("id, content, created_at, sender_id")
    .single();

  if (error) return { ok: false, error: "Pesan belum dapat dikirim. Coba lagi." };

  const metadata = user.user_metadata;
  const author =
    typeof metadata.full_name === "string" && metadata.full_name
      ? metadata.full_name
      : typeof metadata.username === "string" && metadata.username
        ? metadata.username
        : "Kamu";

  return {
    ok: true,
    data: {
      id: data.id,
      author,
      text: data.content,
      time: new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(data.created_at)),
      mine: true,
      read: false,
    },
  };
}

export async function editMessageAction(
  messageId: string,
  content: string,
): Promise<ActionResult<ChatMessage>> {
  if (!uuidSchema.safeParse(messageId).success) return { ok: false, error: "Pesan tidak valid." };
  const validContent = messageSchema.safeParse(content);
  if (!validContent.success) return { ok: false, error: "Pesan harus berisi 1–4000 karakter." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const { data, error } = await supabase
    .from("messages")
    .update({ content: validContent.data })
    .eq("id", messageId)
    .eq("sender_id", user.id)
    .select("id, content, created_at, sender_id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Pesan tidak dapat diedit." };

  const metadata = user.user_metadata;
  const author =
    typeof metadata.full_name === "string" && metadata.full_name
      ? metadata.full_name
      : typeof metadata.username === "string" && metadata.username
        ? metadata.username
        : "Kamu";

  return {
    ok: true,
    data: {
      id: data.id,
      author,
      text: data.content,
      time: new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(data.created_at)),
      mine: true,
    },
  };
}
