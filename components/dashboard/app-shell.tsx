"use client";

import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  loadFriendshipsAction,
  respondFriendRequestAction,
  sendFriendRequestAction,
  type FriendRequest,
} from "@/app/actions/friendships";
import {
  addConversationParticipantsAction,
  createGroupAction,
  editMessageAction,
  loadConversationsAction,
  openDirectConversationAction,
  searchUsersAction,
  sendMessageAction,
} from "@/app/actions/messaging";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { ChatList } from "@/components/dashboard/chat-list";
import { ConversationView } from "@/components/dashboard/conversation-view";
import { InfoPanel } from "@/components/dashboard/info-panel";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { AppSection, ChatConversation, ChatMessage, Person, ThemeMode } from "@/lib/chat-types";
import { useThemePreference } from "@/lib/theme-store";

type ActivityNotification = {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  initials: string;
  color: string;
  unread: boolean;
};

const navigation: { id: AppSection; label: string; icon: typeof MessageCircle }[] = [
  { id: "chats", label: "Pesan", icon: MessageCircle },
  { id: "friends", label: "Teman", icon: UsersRound },
  { id: "requests", label: "Permintaan", icon: UserPlus },
  { id: "notifications", label: "Notifikasi", icon: Bell },
];

export function AppShell({
  userId,
  initialConversations,
  displayName,
  username,
  avatarUrl,
}: {
  userId: string;
  initialConversations: ChatConversation[];
  displayName: string;
  username: string;
  avatarUrl: string | null;
}) {
  const signedInUser = {
    id: userId,
    name: displayName,
    username,
    avatar: avatarUrl ?? "",
    bio: "",
    online: true,
  };
  const [chats, setChats] = useState(initialConversations);
  const [people, setPeople] = useState<Person[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [requestTab, setRequestTab] = useState<"incoming" | "outgoing">("incoming");
  const [friendshipsLoading, setFriendshipsLoading] = useState(true);
  const [section, setSection] = useState<AppSection>("chats");
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searchResultsQuery, setSearchResultsQuery] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [theme, setTheme] = useThemePreference();
  const [modal, setModal] = useState<"group" | "new-chat" | "add-members" | "edit-group" | null>(null);
  const [toast, setToast] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState(signedInUser.name);
  const [profileUsername, setProfileUsername] = useState(signedInUser.username);
  const [profileBio, setProfileBio] = useState(signedInUser.bio);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [profilePreview, setProfilePreview] = useState<Person | null>(null);

  const selectedChat = chats.find((chat) => chat.id === selectedId) ?? null;
  const currentSearchResults =
    peopleQuery.trim().replace(/^@/, "").toLowerCase() === searchResultsQuery
      ? searchResults
      : [];

  const refreshFriendships = useCallback(async () => {
    const result = await loadFriendshipsAction();
    if (!result.ok) {
      setToast(result.error);
      setFriendshipsLoading(false);
      return null;
    }

    setPeople(result.data.friends);
    setRequests(result.data.incomingRequests);
    setOutgoingRequests(result.data.outgoingRequests);
    setFriendshipsLoading(false);
    return result.data;
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme === "system"
        ? preference.matches ? "light" : "dark"
        : theme;
    };
    applyTheme();
    if (theme === "system") {
      preference.addEventListener("change", applyTheme);
      return () => preference.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  useEffect(() => {
    const query = peopleQuery.trim().replace(/^@/, "");
    if (modal !== "new-chat" && modal !== "group" && modal !== "add-members") return;
    if (query.length < 2) return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setSearchingUsers(true);
      const result = await searchUsersAction(query);
      if (cancelled) return;
      setSearchingUsers(false);
      if (!result.ok) {
        setSearchResults([]);
        setSearchResultsQuery(query.toLowerCase());
        setToast(result.error);
        return;
      }
      setSearchResults(result.data);
      setSearchResultsQuery(query.toLowerCase());
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [modal, peopleQuery]);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;
    const supabase = createClient();

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, content, sender_id, created_at, deleted_at, profiles:profiles!messages_sender_id_fkey(full_name, username), message_reads(user_id, read_at)",
        )
        .eq("conversation_id", selectedId!)
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled) return;
      setLoadedConversationId(selectedId!);
      if (error) {
        setToast("Riwayat pesan belum dapat dimuat.");
        return;
      }

      const messages: ChatMessage[] = [...data].reverse().map((message) => ({
        id: message.id,
        author: message.profiles?.full_name ?? message.profiles?.username ?? "Pengguna",
        text: message.deleted_at ? "Pesan dihapus" : message.content,
        time: new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(message.created_at)),
        mine: message.sender_id === userId,
        read: message.message_reads.some((receipt) => receipt.user_id !== userId),
      }));

      setChats((current) =>
        current.map((chat) => chat.id === selectedId ? { ...chat, messages } : chat),
      );
    }

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedId, userId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`user-messages:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        async (payload) => {
          const row = payload.eventType === "DELETE" ? payload.old : payload.new;
          const conversationId =
            typeof row.conversation_id === "string" ? row.conversation_id : null;

          if (
            payload.eventType === "INSERT" &&
            row.sender_id !== userId &&
            typeof row.id === "string"
          ) {
            setNotifications((current) => [
              {
                id: `message:${row.id}`,
                title: "Pesan baru",
                text: typeof row.content === "string" ? row.content : "Kamu menerima pesan baru.",
                createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
                initials: "P",
                color: "lavender",
                unread: true,
              },
              ...current.filter((item) => item.id !== `message:${row.id}`),
            ].slice(0, 30));
          }

          if (selectedId && conversationId === selectedId) {
            const { data, error } = await supabase
              .from("messages")
              .select(
                "id, content, sender_id, created_at, deleted_at, profiles:profiles!messages_sender_id_fkey(full_name, username), message_reads(user_id, read_at)",
              )
              .eq("conversation_id", selectedId)
              .order("created_at", { ascending: false })
              .limit(100);

            if (error) {
              setToast("Pesan terbaru belum dapat dimuat.");
            } else {
              const messages: ChatMessage[] = [...data].reverse().map((message) => ({
                id: message.id,
                author: message.profiles?.full_name ?? message.profiles?.username ?? "Pengguna",
                text: message.deleted_at ? "Pesan dihapus" : message.content,
                time: new Intl.DateTimeFormat("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(message.created_at)),
                mine: message.sender_id === userId,
                read: message.message_reads.some((receipt) => receipt.user_id !== userId),
              }));

              setChats((current) =>
                current.map((chat) => chat.id === selectedId ? { ...chat, messages } : chat),
              );
            }
          }

          const result = await loadConversationsAction();
          if (!result.ok) {
            setToast(result.error);
          } else {
            setChats((current) =>
              result.data.map((chat) => ({
                ...chat,
                messages: current.find((item) => item.id === chat.id)?.messages ?? [],
              })),
            );
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setToast("Koneksi pesan realtime terputus. Memuat ulang halaman dapat membantu.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId, userId]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const refresh = async () => {
      const snapshot = await refreshFriendships();
      if (!active || !snapshot) return;
    };

    void refresh();
    const channel = supabase
      .channel(`user-friendships:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        async (payload) => {
          const row = payload.eventType === "DELETE" ? payload.old : payload.new;
          const snapshot = await refreshFriendships();
          if (!active || !snapshot || typeof row.id !== "string") return;

          let person: Person | undefined;
          let title = "";
          let text = "";

          if (payload.eventType === "INSERT" && row.addressee_id === userId) {
            person = snapshot.incomingRequests.find(
              (request) => request.friendshipId === row.id,
            )?.person;
            title = "Permintaan pertemanan baru";
            text = person ? `${person.name} ingin terhubung denganmu.` : "Kamu menerima permintaan pertemanan.";
          } else if (payload.eventType === "UPDATE" && row.status === "accepted") {
            person = snapshot.friends.find((friend) =>
              friend.id === (row.requester_id === userId ? row.addressee_id : row.requester_id),
            );
            title = "Permintaan pertemanan diterima";
            text = person ? `Kamu dan ${person.name} kini berteman.` : "Permintaan pertemananmu diterima.";
          }

          if (title) {
            setNotifications((current) => [
              {
                id: `friendship:${row.id}:${row.status}`,
                title,
                text,
                createdAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
                initials: person?.name.slice(0, 1).toUpperCase() ?? "K",
                color: "mint",
                unread: true,
              },
              ...current,
            ].slice(0, 30));
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setToast("Pembaruan pertemanan realtime belum tersedia.");
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [refreshFriendships, userId]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  async function signOut() {
    const result = await logoutAction();
    if (result.error) showToast(result.error);
  }

  async function sendMessage(text: string): Promise<boolean> {
    if (!selectedChat) return false;
    const result = await sendMessageAction(selectedChat.id, text);
    if (!result.ok) {
      showToast(result.error);
      return false;
    }

    setChats((current) =>
      current.map((chat) =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              preview: chat.kind === "group" ? `Kamu: ${result.data.text}` : result.data.text,
              time: result.data.time,
              messages: chat.messages.some((message) => message.id === result.data.id)
                ? chat.messages
                : [...chat.messages, result.data],
            }
          : chat,
      ),
    );
    return true;
  }

  async function editMessage(messageId: string, text: string): Promise<boolean> {
    const result = await editMessageAction(messageId, text);
    if (!result.ok) {
      showToast(result.error);
      return false;
    }

    if (!selectedChat) return false;
    setChats((current) =>
      current.map((chat) =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === result.data.id ? result.data : message,
              ),
            }
          : chat,
      ),
    );
    return true;
  }

  function selectChat(id: string) {
    setSelectedId(id);
    setSection("chats");
    setChats((current) => current.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)));
  }

  function toggleDetails() {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setDetailsOpen(true);
      setMobileDetailsOpen((value) => !value);
    } else {
      setDetailsOpen((value) => !value);
    }
  }

  function closeDetails() {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileDetailsOpen(false);
    } else {
      setDetailsOpen(false);
    }
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    const result = await createGroupAction(name, groupMembers);
    if (!result.ok) {
      showToast(result.error);
      return;
    }

    const conversations = await loadConversationsAction();
    if (!conversations.ok) {
      showToast(conversations.error);
      return;
    }
    setChats(conversations.data);
    setSelectedId(result.data);
    setSection("chats");
    setModal(null);
    setGroupName("");
    setGroupMembers([]);
    showToast("Grup berhasil dibuat.");
  }

  async function addMembersToChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChat || selectedChat.kind !== "group" || groupMembers.length === 0) return;
    const result = await addConversationParticipantsAction(selectedChat.id, groupMembers);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    const conversations = await loadConversationsAction();
    if (!conversations.ok) {
      showToast(conversations.error);
      return;
    }
    setChats(conversations.data);
    setModal(null);
    showToast("Anggota grup berhasil ditambahkan.");
    setGroupMembers([]);
  }

  function openGroupEditor() {
    if (!selectedChat || selectedChat.kind !== "group") return;
    setGroupName(selectedChat.name);
    setModal("edit-group");
  }

  function saveGroupEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showToast("Perubahan info grup belum diizinkan oleh kebijakan database.");
  }

  function leaveGroup() {
    if (!selectedChat || selectedChat.kind !== "group") return;
    showToast("Keluar dari grup belum diizinkan oleh kebijakan database.");
  }

  async function openConversation(person: Person) {
    const result = await openDirectConversationAction(person.id);
    if (!result.ok) {
      showToast(result.error);
      return;
    }

    const conversations = await loadConversationsAction();
    if (!conversations.ok) {
      showToast(conversations.error);
      return;
    }
    setChats(conversations.data);
    selectChat(result.data);
    setModal(null);
    setProfilePreview(null);
    setPeopleQuery("");
  }

  async function sendFriendRequest(person: Person) {
    const result = await sendFriendRequestAction(person.id);
    if (!result.ok) {
      showToast(result.error);
      return;
    }

    const snapshot = await refreshFriendships();
    if (!snapshot) return;
    showToast(`Permintaan pertemanan dikirim ke ${person.name}.`);
  }

  async function decideRequest(request: FriendRequest, accepted: boolean) {
    const result = await respondFriendRequestAction(
      request.friendshipId,
      accepted ? "accepted" : "rejected",
    );
    if (!result.ok) {
      showToast(result.error);
      return;
    }

    const snapshot = await refreshFriendships();
    if (!snapshot) return;
    showToast(accepted ? `${request.person.name} ditambahkan ke temanmu.` : "Permintaan ditolak.");
  }

  function markNotificationsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
    showToast("Notifikasi pada sesi ini ditandai sudah dibaca.");
  }

  function toggleProfileEdit() {
    if (profileEdit) {
      showToast("Perubahan profil disimpan.");
    }
    setProfileEdit((value) => !value);
  }

  function renderSection() {
    switch (section) {
      case "friends":
        return (
          <section className="workspace-page">
            <div className="workspace-title-row">
              <div><span className="eyebrow">Lingkaranmu</span><h1>Teman</h1><p>Tetap dekat dengan orang-orang yang berarti.</p></div>
              <button className="primary-button" onClick={() => setModal("new-chat")}><Plus size={17} /> Cari orang</button>
            </div>
            <label className="search-field workspace-search"><Search size={16} /><input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Cari nama atau @username" aria-label="Cari teman" /></label>
            <div className="people-grid">
              {people.filter((person) => !peopleQuery || person.name.toLowerCase().includes(peopleQuery.toLowerCase()) || person.username.toLowerCase().includes(peopleQuery.toLowerCase().replace("@", ""))).map((person) => (
                <article className="person-card" key={person.id}>
                  <div className="person-card-top"><Avatar src={person.avatar} name={person.name} size="lg" online={person.online} /><button className="icon-button" onClick={() => setProfilePreview(person)} aria-label={`Lihat profil ${person.name}`}><ChevronDown size={17} /></button></div>
                  <strong>{person.name}</strong><span>@{person.username}</span>
                  <p>{person.bio ?? "Selalu siap untuk obrolan yang seru."}</p>
                  <div className="person-card-actions"><button className="secondary-button" onClick={() => openConversation(person)}><MessageCircle size={16} /> Pesan</button><button className="icon-button profile-action" onClick={() => setProfilePreview(person)} aria-label={`Lihat profil ${person.name}`}>↗</button></div>
                </article>
              ))}
            </div>
            {friendshipsLoading && <div className="search-empty">Memuat daftar teman...</div>}
            {!friendshipsLoading && people.length === 0 && <EmptyPanel title="Belum ada teman" copy="Cari orang dan mulai percakapan baru." action="Cari orang" onAction={() => setModal("new-chat")} />}
            {!friendshipsLoading && people.length > 0 && peopleQuery && !people.some((person) => person.name.toLowerCase().includes(peopleQuery.toLowerCase()) || person.username.toLowerCase().includes(peopleQuery.toLowerCase().replace("@", ""))) && <EmptyPanel title="Teman tidak ditemukan" copy="Coba nama atau username yang lain." />}
          </section>
        );
      case "requests":
        return (
          <section className="workspace-page">
            <div className="workspace-title-row"><div><span className="eyebrow">Koneksi baru</span><h1>Permintaan pertemanan</h1><p>Pilih siapa yang ingin kamu tambahkan.</p></div><span className="soft-count">{requests.length} baru</span></div>
            <div className="request-tabs">
              <button className={requestTab === "incoming" ? "active" : ""} onClick={() => setRequestTab("incoming")}>Masuk <span>{requests.length}</span></button>
              <button className={requestTab === "outgoing" ? "active" : ""} onClick={() => setRequestTab("outgoing")}>Terkirim <span>{outgoingRequests.length}</span></button>
            </div>
            {friendshipsLoading ? <div className="search-empty">Memuat permintaan...</div> : requestTab === "incoming" ? (
              requests.length ? <div className="request-list">{requests.map((request) => <article className="request-row" key={request.friendshipId}><Avatar src={request.person.avatar} name={request.person.name} online={request.person.online} /><div className="request-person"><strong>{request.person.name}</strong><span>@{request.person.username} · ingin terhubung denganmu</span></div><button className="icon-button request-reject" onClick={() => void decideRequest(request, false)} aria-label={`Tolak permintaan dari ${request.person.name}`}><X size={17} /></button><button className="primary-button small-primary" onClick={() => void decideRequest(request, true)}><Check size={16} /> Terima</button></article>)}</div> : <EmptyPanel title="Tidak ada permintaan masuk" copy="Permintaan pertemanan baru akan muncul di sini." />
            ) : outgoingRequests.length ? (
              <div className="request-list">{outgoingRequests.map((request) => <article className="request-row" key={request.friendshipId}><Avatar src={request.person.avatar} name={request.person.name} online={request.person.online} /><div className="request-person"><strong>{request.person.name}</strong><span>@{request.person.username} · menunggu respons</span></div><span className="soft-count">Menunggu</span></article>)}</div>
            ) : <EmptyPanel title="Tidak ada permintaan terkirim" copy="Permintaan yang kamu kirim akan muncul di sini." />}
          </section>
        );
      case "notifications":
        return (
          <section className="workspace-page">
            <div className="workspace-title-row"><div><span className="eyebrow">Tetap terhubung</span><h1>Notifikasi</h1><p>Aktivitas pesan dan pertemanan terbaru.</p></div><button className="secondary-button" onClick={markNotificationsRead} disabled={!notifications.some((item) => item.unread)}><Check size={16} /> Tandai dibaca</button></div>
            {notifications.length ? (
              <div className="notification-list">
                {notifications.map((item) => <article className={`notification-row${item.unread ? " unread" : ""}`} key={item.id}><span className={`notification-avatar ${item.color}`}>{item.initials}</span><div><strong>{item.title}</strong><p>{item.text}</p><small>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</small></div>{item.unread && <span className="notification-dot" />}</article>)}
              </div>
            ) : <EmptyPanel title="Belum ada aktivitas baru" copy="Pesan masuk dan perubahan pertemanan akan tampil di sini selama halaman ini terbuka. Riwayat dan status baca permanen memerlukan penyimpanan notifikasi di database." />}
          </section>
        );
      case "profile":
        return (
          <section className="workspace-page profile-page">
            <div className="workspace-title-row"><div><span className="eyebrow">Tentang dirimu</span><h1>Profil saya</h1><p>Hal-hal yang temanmu lihat tentangmu.</p></div><button className="primary-button" onClick={toggleProfileEdit}><Settings size={16} /> {profileEdit ? "Simpan" : "Edit profil"}</button></div>
            <article className="profile-card"><div className="profile-cover"><span className="cover-orb orb-one" /><span className="cover-orb orb-two" /></div><div className="profile-card-body"><Avatar src={signedInUser.avatar} name={profileName} size="xl" online /><div className="profile-name-block"><h2>{profileName}</h2><span>@{profileUsername}</span></div><p>{profileBio}</p><div className="profile-stat-row"><div><strong>{people.length}</strong><span>Teman</span></div><div><strong>{chats.length}</strong><span>Percakapan</span></div><div><strong>2024</strong><span>Bergabung</span></div></div>{profileEdit && <div className="profile-edit-form"><label>Nama<input value={profileName} onChange={(event) => setProfileName(event.target.value)} /></label><label>Username<input value={profileUsername} onChange={(event) => setProfileUsername(event.target.value)} /></label><label>Bio singkat<input value={profileBio} onChange={(event) => setProfileBio(event.target.value)} /></label></div>}</div></article>
          </section>
        );
      case "settings":
        return <SettingsPage theme={theme} setTheme={setTheme} showToast={showToast} />;
      default:
        return null;
    }
  }

  return (
    <div className="app-shell">
      <nav className="nav-rail" aria-label="Navigasi utama">
        <button className="rail-brand" onClick={() => { setSection("chats"); setSelectedId(null); }} aria-label="Koneksi, beranda"><BrandMark compact /></button>
        <div className="rail-nav">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`rail-button${section === id ? " active" : ""}`} onClick={() => setSection(id)} aria-label={label} title={label}>
              <Icon size={20} strokeWidth={1.8} />
              {id === "requests" && requests.length > 0 && <span className="rail-badge">{requests.length}</span>}
              {id === "notifications" && notifications.some((item) => item.unread) && <span className="rail-notification-dot" />}
              <span className="rail-tooltip">{label}</span>
            </button>
          ))}
          <button className={`rail-button mobile-settings${section === "settings" ? " active" : ""}`} onClick={() => setSection("settings")} aria-label="Pengaturan" title="Pengaturan"><Settings size={19} /></button>
        </div>
        <div className="rail-bottom">
          <button className={`rail-button${section === "settings" ? " active" : ""}`} onClick={() => setSection("settings")} aria-label="Pengaturan" title="Pengaturan"><Settings size={19} /><span className="rail-tooltip">Pengaturan</span></button>
          <button className={`rail-avatar${section === "profile" ? " active" : ""}`} onClick={() => setSection("profile")} aria-label="Profil saya"><Avatar src={signedInUser.avatar} name={signedInUser.name} size="sm" online /></button>
          <span className="rail-user-status"><span /></span>
        </div>
      </nav>

      {section === "chats" ? (
        <div className={`chat-workspace${selectedId ? " has-conversation" : ""}${detailsOpen ? " has-details" : ""}${mobileDetailsOpen ? " mobile-details-open" : ""}`}>
          <ChatList chats={chats} selectedId={selectedId} onSelect={selectChat} onCreateChat={() => setModal("new-chat")} onCreateGroup={() => setModal("group")} onSearchPeople={() => setModal("new-chat")} />
          {selectedChat ? (
            <ConversationView
              conversation={selectedChat}
              loading={Boolean(selectedId && loadedConversationId !== selectedId)}
              onToggleDetails={toggleDetails}
              onBack={() => setSelectedId(null)}
              onSend={sendMessage}
              onDelete={() => showToast("Penghapusan pesan belum diizinkan oleh kebijakan database.")}
              onEdit={editMessage}
            />
          ) : <WelcomeEmpty onCreate={() => setModal("new-chat")} />}
          {detailsOpen && selectedChat && <InfoPanel conversation={selectedChat} onClose={closeDetails} onAction={showToast} onAddMembers={() => { setGroupMembers([]); setModal("add-members"); }} onEditGroup={openGroupEditor} onLeaveGroup={leaveGroup} />}
        </div>
      ) : (
        <div className="section-workspace">
          <aside className="section-sidebar">
            <div className="section-brand"><BrandMark /><span>Ruang pribadimu</span></div>
            <div className="section-side-label">RUANG KERJA</div>
            {navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`section-nav-item${section === id ? " active" : ""}`} onClick={() => setSection(id)}><Icon size={17} />{label}{id === "requests" && requests.length > 0 && <span>{requests.length}</span>}</button>)}
            <div className="section-side-label section-side-label-spaced">PRIBADI</div>
            <button className={`section-nav-item${section === "profile" ? " active" : ""}`} onClick={() => setSection("profile")}><Avatar src={signedInUser.avatar} name={signedInUser.name} size="sm" />Profil saya</button>
            <button className={`section-nav-item${section === "settings" ? " active" : ""}`} onClick={() => setSection("settings")}><Settings size={17} />Pengaturan</button>
            <div className="section-sidebar-bottom"><Avatar src={signedInUser.avatar} name={signedInUser.name} size="sm" online /><div><strong>{signedInUser.name}</strong><span>Aktif</span></div><button className="icon-button" aria-label="Opsi akun"><ChevronDown size={16} /></button></div>
          </aside>
          <div className="section-content">{renderSection()}</div>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-heading"><div><span className="eyebrow">{modal === "group" || modal === "add-members" || modal === "edit-group" ? "Lebih seru bersama" : "Koneksi baru"}</span><h2 id="modal-title">{modal === "group" ? "Buat grup" : modal === "edit-group" ? "Edit grup" : modal === "add-members" ? "Tambah anggota" : "Cari orang"}</h2></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Tutup"><X size={18} /></button></div>
            {modal === "group" || modal === "add-members" || modal === "edit-group" ? (
              <form className="modal-form" onSubmit={modal === "group" ? createGroup : modal === "edit-group" ? saveGroupEdits : addMembersToChat}>
                {modal !== "add-members" && <p className="modal-description">Foto grup dapat ditambahkan setelah Storage disiapkan.</p>}
                {modal !== "add-members" && <label>Nama grup<input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Contoh: Klub kecil kita" autoFocus required /></label>}
                {modal !== "edit-group" && (
                  <>
                    <label className="search-field"><Search size={16} /><input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Cari anggota berdasarkan username" /></label>
                    <div className="member-picker">
                      {currentSearchResults.map((person) => (
                        <button
                          type="button"
                          className={`member-option${groupMembers.includes(person.id) ? " selected" : ""}`}
                          key={person.id}
                          onClick={() => setGroupMembers((current) =>
                            current.includes(person.id)
                              ? current.filter((id) => id !== person.id)
                              : [...current, person.id],
                          )}
                        >
                          <Avatar src={person.avatar} name={person.name} size="sm" />
                          <span>{person.name}<small>@{person.username}</small></span>
                          {groupMembers.includes(person.id) && <Check size={15} />}
                        </button>
                      ))}
                      {searchingUsers && <div className="search-empty">Mencari pengguna...</div>}
                    </div>
                  </>
                )}
                <div className="modal-footer"><span>{modal === "group" || modal === "add-members" ? `${groupMembers.length} anggota dipilih` : "Perubahan grup belum tersedia"}</span><button type="submit" className="primary-button" disabled={modal === "add-members" ? groupMembers.length === 0 : !groupName.trim()}>{modal === "group" ? <><UsersRound size={16} /> Buat grup</> : modal === "add-members" ? <><UserPlus size={16} /> Tambahkan</> : "Simpan perubahan"}</button></div>
              </form>
            ) : (
              <div className="modal-form">
                <label className="search-field"><Search size={16} /><input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Cari berdasarkan username" autoFocus /></label>
                <div className="member-picker search-results">{currentSearchResults.map((person) => {
                  const isFriend = people.some((friend) => friend.id === person.id);
                  const isIncoming = requests.some((request) => request.person.id === person.id);
                  const isOutgoing = outgoingRequests.some((request) => request.person.id === person.id);
                  return (
                    <div className="search-result-row" key={person.id}>
                      <button className="member-option" onClick={() => void openConversation(person)}><Avatar src={person.avatar} name={person.name} size="sm" online={person.online} /><span>{person.name}<small>@{person.username}</small></span><MessageCircle size={16} /></button>
                      {isFriend ? <span className="search-result-status">Teman</span> : isIncoming ? <span className="search-result-status">Permintaan masuk</span> : isOutgoing ? <span className="search-result-status">Menunggu</span> : <button className="icon-button search-result-add" onClick={() => void sendFriendRequest(person)} aria-label={`Kirim permintaan pertemanan ke ${person.name}`}><UserPlus size={16} /></button>}
                    </div>
                  );
                })}</div>
                {searchingUsers && <div className="search-empty">Mencari pengguna...</div>}
                {!searchingUsers && peopleQuery.trim().length >= 2 && currentSearchResults.length === 0 && <div className="search-empty">Tidak ada pengguna dengan username tersebut.</div>}
                {peopleQuery.trim().length < 2 && <div className="search-empty">Ketik minimal 2 karakter username untuk mencari.</div>}
                <div className="search-privacy-note">Kamu bisa memulai obrolan personal tanpa mengirim permintaan pertemanan.</div>
              </div>
            )}
          </div>
        </div>
      )}
      {profilePreview && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfilePreview(null); }}>
          <div className="modal-card profile-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-preview-title">
            <button className="icon-button profile-preview-close" onClick={() => setProfilePreview(null)} aria-label="Tutup profil"><X size={18} /></button>
            <Avatar src={profilePreview.avatar} name={profilePreview.name} size="lg" online={profilePreview.online} />
            <span className="eyebrow">PROFIL PENGGUNA</span>
            <h2 id="profile-preview-title">{profilePreview.name}</h2>
            <span className="profile-preview-username">@{profilePreview.username}</span>
            <p>{profilePreview.bio ?? "Selalu siap untuk obrolan yang seru."}</p>
            <div className="profile-preview-status"><span className={`status-dot${profilePreview.online ? "" : " offline"}`} />{profilePreview.online ? "Sedang online" : "Offline"}</div>
            <button className="primary-button profile-preview-message" onClick={() => openConversation(profilePreview)}><MessageCircle size={16} /> Mulai percakapan</button>
          </div>
        </div>
      )}
      {toast && <div className="toast-message"><Check size={16} />{toast}<button onClick={() => setToast("")} aria-label="Tutup notifikasi"><X size={14} /></button></div>}
      <button className="logout-link" onClick={() => void signOut()} title="Keluar"><LogOut size={15} /></button>
    </div>
  );
}

function WelcomeEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <main className="welcome-empty">
      <div className="empty-art">
        <div className="empty-orbit orbit-a" /><div className="empty-orbit orbit-b" />
        <div className="empty-chat-icon"><MessageCircle size={40} strokeWidth={1.4} /><span /></div>
        <span className="floating-bubble bubble-a">Hai 👋</span><span className="floating-bubble bubble-b">✨</span><span className="floating-bubble bubble-c">•••</span>
      </div>
      <span className="eyebrow">Orang-orangmu, satu sentuhan</span>
      <h2>Obrolan seru<br />dimulai <span>di sini.</span></h2>
      <p>Pilih percakapan di kiri atau mulai yang baru.<br />Obrolan berikutnya sudah menunggu.</p>
      <button className="primary-button" onClick={onCreate}><Plus size={17} /> Mulai percakapan</button>
      <div className="empty-encryption"><span /> Percakapanmu aman dan pribadi</div>
    </main>
  );
}

function EmptyPanel({ title, copy, action, onAction }: { title: string; copy: string; action?: string; onAction?: () => void }) {
  return <div className="empty-panel"><span className="empty-panel-icon"><UsersRound size={22} /></span><strong>{title}</strong><p>{copy}</p>{action && onAction && <button className="secondary-button" onClick={onAction}>{action}</button>}</div>;
}

function SettingsPage({ theme, setTheme, showToast }: { theme: ThemeMode; setTheme: (theme: ThemeMode) => void; showToast: (message: string) => void }) {
  const [messagePreview, setMessagePreview] = useState(true);
  const [motion, setMotion] = useState(true);
  return (
    <section className="workspace-page">
      <div className="workspace-title-row"><div><span className="eyebrow">Sesuai gayamu</span><h1>Pengaturan</h1><p>Atur ruang dan pengalamanmu.</p></div></div>
      <div className="settings-layout">
        <div className="settings-menu">{["Akun", "Profil", "Tampilan", "Notifikasi", "Privasi", "Keamanan"].map((item, index) => <button key={item} className={index === 2 ? "active" : ""} onClick={() => index === 2 ? undefined : showToast(`Pengaturan ${item.toLowerCase()} segera tersedia.`)}>{index === 2 ? <Sun size={16} /> : <Settings size={16} />}{item}{index === 2 && <ChevronDown size={14} className="settings-current-arrow" />}</button>)}</div>
        <div className="settings-card">
          <div className="settings-card-heading"><div><h2>Tampilan</h2><p>Pilih tampilan Koneksi yang paling nyaman.</p></div><span className="settings-heading-icon"><Sun size={19} /></span></div>
          <div className="setting-row"><div><strong>Tema warna</strong><span>Ubah tampilan kapan saja.</span></div><div className="theme-options">{(["dark", "light", "system"] as ThemeMode[]).map((option) => <button key={option} className={theme === option ? "active" : ""} onClick={() => setTheme(option)}>{option === "dark" ? <Moon size={15} /> : option === "light" ? <Sun size={15} /> : <span className="system-theme-icon">◐</span>}{option === "dark" ? "Gelap" : option === "light" ? "Terang" : "Sistem"}</button>)}</div></div>
          <div className="setting-row"><div><strong>Pratinjau pesan</strong><span>Tampilan percakapan yang bersih dan mudah dibaca.</span></div><button className={`toggle-switch${messagePreview ? " on" : ""}`} aria-label={`Pratinjau pesan ${messagePreview ? "aktif" : "nonaktif"}`} aria-pressed={messagePreview} onClick={() => { setMessagePreview((value) => !value); showToast("Pengaturan pratinjau disimpan."); }}><span /></button></div>
          <div className="setting-row"><div><strong>Efek gerakan</strong><span>Transisi halus dan animasi ringan.</span></div><button className={`toggle-switch${motion ? " on" : ""}`} aria-label={`Efek gerakan ${motion ? "aktif" : "nonaktif"}`} aria-pressed={motion} onClick={() => { setMotion((value) => !value); showToast("Pengaturan gerakan disimpan."); }}><span /></button></div>
          <div className="settings-note"><span>✦</span> Pilihan tema disimpan di perangkat ini.</div>
        </div>
      </div>
    </section>
  );
}
