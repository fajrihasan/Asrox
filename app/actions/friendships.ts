"use server";

import { z } from "zod";
import type { Person } from "@/lib/chat-types";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export type FriendRequest = {
  friendshipId: string;
  person: Person;
  createdAt: string;
};

export type FriendshipSnapshot = {
  friends: Person[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
};

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type ProfileSummary = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

function toPerson(profile: ProfileSummary | null): Person | null {
  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.full_name ?? profile.username,
    username: profile.username,
    avatar: profile.avatar_url ?? "",
    online: false,
    bio: profile.bio ?? undefined,
  };
}

export async function loadFriendshipsAction(): Promise<ActionResult<FriendshipSnapshot>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const { data, error } = await supabase
    .from("friendships")
    .select(
      "id, requester_id, addressee_id, status, created_at, requester:profiles!friendships_requester_id_fkey(id, username, full_name, avatar_url, bio), addressee:profiles!friendships_addressee_id_fkey(id, username, full_name, avatar_url, bio)",
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: "Data pertemanan belum dapat dimuat." };
  }

  const snapshot: FriendshipSnapshot = {
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
  };

  for (const friendship of data) {
    const isRequester = friendship.requester_id === user.id;
    const person = toPerson(isRequester ? friendship.addressee : friendship.requester);
    if (!person) continue;

    if (friendship.status === "accepted") {
      snapshot.friends.push(person);
    } else if (friendship.status === "pending") {
      const request = {
        friendshipId: friendship.id,
        person,
        createdAt: friendship.created_at,
      };
      if (isRequester) snapshot.outgoingRequests.push(request);
      else snapshot.incomingRequests.push(request);
    }
  }

  return { ok: true, data: snapshot };
}

export async function sendFriendRequestAction(
  targetUserId: string,
): Promise<ActionResult<undefined>> {
  if (!uuidSchema.safeParse(targetUserId).success) {
    return { ok: false, error: "Pengguna yang dipilih tidak valid." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const { error } = await supabase.rpc("send_friend_request", {
    target_user_id: targetUserId,
  });
  if (error) {
    return {
      ok: false,
      error: "Permintaan tidak dapat dikirim. Periksa apakah permintaan atau pertemanan sudah ada.",
    };
  }

  return { ok: true, data: undefined };
}

export async function respondFriendRequestAction(
  friendshipId: string,
  response: "accepted" | "rejected",
): Promise<ActionResult<undefined>> {
  if (!uuidSchema.safeParse(friendshipId).success) {
    return { ok: false, error: "Permintaan pertemanan tidak valid." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const { error } = await supabase.rpc("respond_friend_request", {
    target_friendship_id: friendshipId,
    response,
  });
  if (error) {
    return { ok: false, error: "Permintaan tidak dapat diproses atau sudah ditanggapi." };
  }

  return { ok: true, data: undefined };
}
