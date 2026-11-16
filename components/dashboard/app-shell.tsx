"use client";

import {
  Bell,
  Check,
  CheckCheck,
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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ChatList } from "@/components/dashboard/chat-list";
import { ConversationView } from "@/components/dashboard/conversation-view";
import { InfoPanel } from "@/components/dashboard/info-panel";
import { Avatar } from "@/components/ui/avatar";
import { conversations as initialConversations, currentUser, friends as initialFriends, incomingRequests as initialRequests } from "@/lib/mock-data";
import type { AppSection, ChatConversation, ChatMessage, Person, ThemeMode } from "@/lib/chat-types";
import { useThemePreference } from "@/lib/theme-store";

const navigation: { id: AppSection; label: string; icon: typeof MessageCircle }[] = [
  { id: "chats", label: "Pesan", icon: MessageCircle },
  { id: "friends", label: "Teman", icon: UsersRound },
  { id: "requests", label: "Permintaan", icon: UserPlus },
  { id: "notifications", label: "Notifikasi", icon: Bell },
];

export function AppShell() {
  const router = useRouter();
  const [chats, setChats] = useState(initialConversations);
  const [people, setPeople] = useState<Person[]>(initialFriends);
  const [requests, setRequests] = useState<Person[]>(initialRequests);
  const [section, setSection] = useState<AppSection>("chats");
  const [selectedId, setSelectedId] = useState<string | null>("nara");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [theme, setTheme] = useThemePreference();
  const [modal, setModal] = useState<"group" | "new-chat" | "add-members" | "edit-group" | null>(null);
  const [toast, setToast] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupAvatar, setGroupAvatar] = useState("");
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileUsername, setProfileUsername] = useState(currentUser.username);
  const [profileBio, setProfileBio] = useState(currentUser.bio ?? "");
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [profilePreview, setProfilePreview] = useState<Person | null>(null);

  const selectedChat = chats.find((chat) => chat.id === selectedId) ?? null;
  const searchedPeople = useMemo(() => {
    const query = peopleQuery.trim().toLocaleLowerCase().replace(/^@/, "");
    if (!query) return [...people, ...requests];
    return [...people, ...requests].filter(
      (person) =>
        person.name.toLocaleLowerCase().includes(query) ||
        person.username.toLocaleLowerCase().includes(query),
    );
  }, [people, peopleQuery, requests]);

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

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function updateChatMessages(chatId: string, update: (messages: ChatMessage[]) => ChatMessage[]) {
    setChats((current) =>
      current.map((chat) => (chat.id === chatId ? { ...chat, messages: update(chat.messages) } : chat)),
    );
  }

  function sendMessage(text: string) {
    if (!selectedChat) return;
    const newMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      author: "Kamu",
      text,
      time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      mine: true,
      read: false,
    };
    updateChatMessages(selectedChat.id, (messages) => [...messages, newMessage]);
    setChats((current) =>
      current.map((chat) =>
        chat.id === selectedChat.id ? { ...chat, preview: text, time: "Baru saja" } : chat,
      ),
    );
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

  function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    const created: ChatConversation = {
      id: `group-${Date.now()}`,
      kind: "group",
      name,
      avatar: groupAvatar,
      preview: "Grup dibuat. Mulai percakapan.",
      time: "Baru saja",
      unread: 0,
      members: groupMembers.length + 1,
      currentUserRole: "owner",
      bio: "Grup baru untuk obrolan terbaikmu.",
      messages: [],
    };
    setChats((current) => [created, ...current]);
    setSelectedId(created.id);
    setSection("chats");
    setModal(null);
    setGroupName("");
    setGroupMembers([]);
    setGroupAvatar("");
    showToast("Grup berhasil dibuat.");
  }

  function addMembersToChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChat || selectedChat.kind !== "group" || groupMembers.length === 0) return;
    setChats((current) => current.map((chat) => chat.id === selectedChat.id
      ? { ...chat, members: (chat.members ?? 1) + groupMembers.length }
      : chat));
    setModal(null);
    showToast(`${groupMembers.length} teman ditambahkan ke grup.`);
    setGroupMembers([]);
  }

  function openGroupEditor() {
    if (!selectedChat || selectedChat.kind !== "group") return;
    setGroupName(selectedChat.name);
    setGroupAvatar(selectedChat.avatar);
    setModal("edit-group");
  }

  function saveGroupEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChat || selectedChat.kind !== "group" || !groupName.trim()) return;
    setChats((current) => current.map((chat) => chat.id === selectedChat.id
      ? { ...chat, name: groupName.trim(), avatar: groupAvatar }
      : chat));
    setModal(null);
    showToast("Info grup berhasil diperbarui.");
  }

  function leaveGroup() {
    if (!selectedChat || selectedChat.kind !== "group") return;
    const name = selectedChat.name;
    setChats((current) => current.filter((chat) => chat.id !== selectedChat.id));
    setSelectedId(null);
    setDetailsOpen(false);
    setMobileDetailsOpen(false);
    showToast(`Kamu keluar dari grup ${name}.`);
  }

  function openConversation(person: Person) {
    let chat = chats.find((item) => item.id === person.id);
    if (!chat) {
      chat = {
        id: person.id,
        kind: "personal",
        name: person.name,
        username: person.username,
        avatar: person.avatar,
        preview: "Mulai percakapan.",
        time: "Baru saja",
        unread: 0,
        online: person.online,
        bio: person.bio,
        messages: [],
      };
      setChats((current) => [chat!, ...current]);
    }
    selectChat(chat.id);
    setModal(null);
    setProfilePreview(null);
    setPeopleQuery("");
  }

  function decideRequest(person: Person, accepted: boolean) {
    setRequests((current) => current.filter((request) => request.id !== person.id));
    if (accepted) setPeople((current) => [...current, person]);
    showToast(accepted ? `${person.name} ditambahkan ke temanmu.` : "Permintaan ditolak.");
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
                  <div className="person-card-top"><Avatar src={person.avatar} name={person.name} size="lg" online={person.online} /><button className="icon-button"><ChevronDown size={17} /></button></div>
                  <strong>{person.name}</strong><span>@{person.username}</span>
                  <p>{person.bio ?? "Selalu siap untuk obrolan yang seru."}</p>
                  <div className="person-card-actions"><button className="secondary-button" onClick={() => openConversation(person)}><MessageCircle size={16} /> Pesan</button><button className="icon-button profile-action" onClick={() => setProfilePreview(person)} aria-label={`Lihat profil ${person.name}`}>↗</button></div>
                </article>
              ))}
            </div>
            {people.length === 0 && <EmptyPanel title="Belum ada teman" copy="Cari orang dan mulai percakapan baru." action="Cari orang" onAction={() => setModal("new-chat")} />}
          </section>
        );
      case "requests":
        return (
          <section className="workspace-page">
            <div className="workspace-title-row"><div><span className="eyebrow">Koneksi baru</span><h1>Permintaan pertemanan</h1><p>Pilih siapa yang ingin kamu tambahkan.</p></div><span className="soft-count">{requests.length} baru</span></div>
            <div className="request-tabs"><button className="active">Masuk <span>{requests.length}</span></button><button onClick={() => showToast("Belum ada permintaan terkirim.")}>Terkirim</button></div>
            {requests.length ? <div className="request-list">{requests.map((person) => <article className="request-row" key={person.id}><Avatar src={person.avatar} name={person.name} online={person.online} /><div className="request-person"><strong>{person.name}</strong><span>@{person.username} · ingin terhubung denganmu</span></div><button className="icon-button request-reject" onClick={() => decideRequest(person, false)} aria-label="Tolak permintaan"><X size={17} /></button><button className="primary-button small-primary" onClick={() => decideRequest(person, true)}><Check size={16} /> Terima</button></article>)}</div> : <EmptyPanel title="Tidak ada permintaan baru" copy="Permintaan baru akan muncul di sini." />}
          </section>
        );
      case "notifications":
        return (
          <section className="workspace-page">
            <div className="workspace-title-row"><div><span className="eyebrow">Tetap terhubung</span><h1>Notifikasi</h1><p>Momen penting, semuanya di satu tempat.</p></div><button className="secondary-button" onClick={() => { setNotificationsRead(true); showToast("Semua notifikasi ditandai sudah dibaca."); }}><CheckCheck size={16} /> Tandai semua dibaca</button></div>
            <div className="notification-list">
              {[
                { title: "Nara mengirim pesan", text: "Seru banget, sampai ketemu besok ya!", time: "2 menit lalu", initials: "N", color: "lavender" },
                { title: "Maya menambahkanmu ke grup", text: "“Rencana Jumat” · 8 anggota", time: "1 jam lalu", initials: "M", color: "peach" },
                { title: "Tiara mengirim permintaan pertemanan", text: "Koneksi baru · @tiara.r", time: "3 jam lalu", initials: "T", color: "mint" },
                { title: "Percakapanmu dengan Bima masih aktif", text: "Lanjutkan obrolan terakhir kalian.", time: "Kemarin", initials: "B", color: "blue" },
              ].map((item, index) => <article className={`notification-row${!notificationsRead && index < 2 ? " unread" : ""}`} key={item.title}><span className={`notification-avatar ${item.color}`}>{item.initials}</span><div><strong>{item.title}</strong><p>{item.text}</p><small>{item.time}</small></div>{!notificationsRead && index < 2 && <span className="notification-dot" />}</article>)}
            </div>
          </section>
        );
      case "profile":
        return (
          <section className="workspace-page profile-page">
            <div className="workspace-title-row"><div><span className="eyebrow">Tentang dirimu</span><h1>Profil saya</h1><p>Hal-hal yang temanmu lihat tentangmu.</p></div><button className="primary-button" onClick={toggleProfileEdit}><Settings size={16} /> {profileEdit ? "Simpan" : "Edit profil"}</button></div>
            <article className="profile-card"><div className="profile-cover"><span className="cover-orb orb-one" /><span className="cover-orb orb-two" /></div><div className="profile-card-body"><Avatar src={currentUser.avatar} name={profileName} size="xl" online /><div className="profile-name-block"><h2>{profileName}</h2><span>@{profileUsername}</span></div><p>{profileBio}</p><div className="profile-stat-row"><div><strong>{people.length}</strong><span>Teman</span></div><div><strong>{chats.length}</strong><span>Percakapan</span></div><div><strong>2024</strong><span>Bergabung</span></div></div>{profileEdit && <div className="profile-edit-form"><label>Nama<input value={profileName} onChange={(event) => setProfileName(event.target.value)} /></label><label>Username<input value={profileUsername} onChange={(event) => setProfileUsername(event.target.value)} /></label><label>Bio singkat<input value={profileBio} onChange={(event) => setProfileBio(event.target.value)} /></label></div>}</div></article>
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
              {id === "notifications" && !notificationsRead && <span className="rail-notification-dot" />}
              <span className="rail-tooltip">{label}</span>
            </button>
          ))}
          <button className={`rail-button mobile-settings${section === "settings" ? " active" : ""}`} onClick={() => setSection("settings")} aria-label="Pengaturan" title="Pengaturan"><Settings size={19} /></button>
        </div>
        <div className="rail-bottom">
          <button className={`rail-button${section === "settings" ? " active" : ""}`} onClick={() => setSection("settings")} aria-label="Pengaturan" title="Pengaturan"><Settings size={19} /><span className="rail-tooltip">Pengaturan</span></button>
          <button className={`rail-avatar${section === "profile" ? " active" : ""}`} onClick={() => setSection("profile")} aria-label="Profil saya"><Avatar src={currentUser.avatar} name={currentUser.name} size="sm" online /></button>
          <span className="rail-user-status"><span /></span>
        </div>
      </nav>

      {section === "chats" ? (
        <div className={`chat-workspace${selectedId ? " has-conversation" : ""}${detailsOpen ? " has-details" : ""}${mobileDetailsOpen ? " mobile-details-open" : ""}`}>
          <ChatList chats={chats} selectedId={selectedId} onSelect={selectChat} onCreateChat={() => setModal("new-chat")} onCreateGroup={() => setModal("group")} onSearchPeople={() => setModal("new-chat")} />
          {selectedChat ? (
            <ConversationView
              conversation={selectedChat}
              onToggleDetails={toggleDetails}
              onBack={() => setSelectedId(null)}
              onSend={sendMessage}
              onDelete={(messageId) => updateChatMessages(selectedChat.id, (messages) => messages.filter((message) => message.id !== messageId))}
              onEdit={(messageId, text) => updateChatMessages(selectedChat.id, (messages) => messages.map((message) => message.id === messageId ? { ...message, text } : message))}
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
            <button className={`section-nav-item${section === "profile" ? " active" : ""}`} onClick={() => setSection("profile")}><Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />Profil saya</button>
            <button className={`section-nav-item${section === "settings" ? " active" : ""}`} onClick={() => setSection("settings")}><Settings size={17} />Pengaturan</button>
            <div className="section-sidebar-bottom"><Avatar src={currentUser.avatar} name={currentUser.name} size="sm" online /><div><strong>{currentUser.name}</strong><span>Aktif</span></div><button className="icon-button" aria-label="Opsi akun"><ChevronDown size={16} /></button></div>
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
                {modal !== "add-members" && <label className="group-photo-picker">
                  <input type="file" accept="image/*" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setGroupAvatar(URL.createObjectURL(file));
                  }} />
                  {groupAvatar ? <Avatar src={groupAvatar} name={groupName || "Grup"} size="lg" group /> : <span className="group-photo-placeholder"><Plus size={19} /></span>}
                  <span><strong>Foto grup</strong><small>Tambahkan gambar jika mau</small></span>
                  <span className="secondary-button group-photo-action">{groupAvatar ? "Ganti" : "Unggah"}</span>
                </label>}
                {modal !== "add-members" && <label>Nama grup<input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Contoh: Klub kecil kita" autoFocus required /></label>}
                {modal === "add-members" && <p className="modal-description">Pilih teman yang ingin ditambahkan ke grup ini.</p>}
                {modal === "group" && <label>Tambahkan teman <span className="optional-label">Bisa ditambahkan nanti</span></label>}
                {modal !== "edit-group" && <div className="member-picker">{people.map((person) => <button type="button" className={`member-option${groupMembers.includes(person.id) ? " selected" : ""}`} key={person.id} onClick={() => setGroupMembers((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])}><Avatar src={person.avatar} name={person.name} size="sm" /><span>{person.name}</span>{groupMembers.includes(person.id) && <Check size={15} />}</button>)}</div>}
                <div className="modal-footer"><span>{modal === "group" || modal === "add-members" ? `${groupMembers.length} teman dipilih` : "Perubahan hanya terlihat di demo ini"}</span><button type="submit" className="primary-button" disabled={modal === "add-members" ? groupMembers.length === 0 : !groupName.trim()}>{modal === "group" ? <><UsersRound size={16} /> Buat grup</> : modal === "add-members" ? <><UserPlus size={16} /> Tambahkan</> : "Simpan perubahan"}</button></div>
              </form>
            ) : (
              <div className="modal-form">
                <label className="search-field"><Search size={16} /><input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Nama atau @username" autoFocus /></label>
                <div className="member-picker search-results">{searchedPeople.map((person) => <button className="member-option" key={person.id} onClick={() => openConversation(person)}><Avatar src={person.avatar} name={person.name} size="sm" online={person.online} /><span>{person.name}<small>@{person.username}</small></span><MessageCircle size={16} /></button>)}</div>
                {searchedPeople.length === 0 && <div className="search-empty">Tidak ada pengguna dengan nama tersebut.</div>}
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
      <button className="logout-link" onClick={() => router.push("/login")} title="Keluar"><LogOut size={15} /></button>
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
