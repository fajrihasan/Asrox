"use client";

import { Archive, Search, SlidersHorizontal, UserRoundPlus, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChatConversation } from "@/lib/chat-types";
import { Avatar } from "@/components/ui/avatar";

type ChatFilter = "all" | "unread" | "personal" | "groups";

interface ChatListProps {
  chats: ChatConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateChat: () => void;
  onCreateGroup: () => void;
  onSearchPeople: () => void;
}

const filters: { id: ChatFilter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "unread", label: "Belum dibaca" },
  { id: "personal", label: "Personal" },
  { id: "groups", label: "Grup" },
];

export function ChatList({
  chats,
  selectedId,
  onSelect,
  onCreateChat,
  onCreateGroup,
  onSearchPeople,
}: ChatListProps) {
  const [filter, setFilter] = useState<ChatFilter>("all");
  const [search, setSearch] = useState("");

  const visibleChats = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return chats.filter((chat) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && chat.unread > 0) ||
        (filter === "personal" && chat.kind === "personal") ||
        (filter === "groups" && chat.kind === "group");
      const matchesSearch =
        !query ||
        chat.name.toLocaleLowerCase().includes(query) ||
        chat.preview.toLocaleLowerCase().includes(query) ||
        chat.username?.toLocaleLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [chats, filter, search]);

  return (
    <aside className="chat-list-panel">
      <div className="chat-list-heading">
        <div>
          <span className="eyebrow">Ruang pribadimu</span>
          <h1>Pesan</h1>
        </div>
        <button
          className="icon-button subtle-button"
          aria-label="Tampilkan percakapan belum dibaca"
          title="Tampilkan percakapan belum dibaca"
          onClick={() => setFilter((current) => current === "unread" ? "all" : "unread")}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>

      <label className="search-field">
        <Search size={16} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari percakapan atau orang"
          aria-label="Cari percakapan"
        />
        {search && (
          <button type="button" className="search-clear" onClick={() => setSearch("")}>
            Hapus
          </button>
        )}
      </label>

      <div className="quick-actions">
        <button className="quick-action" onClick={onCreateChat}>
          <span className="quick-action-icon indigo-icon"><UserRoundPlus size={16} /></span>
          Pesan baru
        </button>
        <button className="quick-action" onClick={onCreateGroup}>
          <span className="quick-action-icon cyan-icon"><UsersRound size={16} /></span>
          Grup baru
        </button>
      </div>

      <div className="filter-row" role="tablist" aria-label="Filter percakapan">
        {filters.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={filter === item.id}
            className={`filter-chip${filter === item.id ? " selected" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="conversation-list">
        <div className="list-section-label">
          <span>Terbaru</span>
          <span className="count-label">{visibleChats.length}</span>
        </div>
        {visibleChats.map((chat) => (
          <button
            key={chat.id}
            className={`conversation-item${selectedId === chat.id ? " active" : ""}`}
            onClick={() => onSelect(chat.id)}
          >
            <Avatar
              src={chat.avatar}
              name={chat.name}
              online={chat.online}
              group={chat.kind === "group"}
            />
            <span className="conversation-copy">
              <span className="conversation-title-row">
                <span className="conversation-name">{chat.name}</span>
                <span className="conversation-time">{chat.time}</span>
              </span>
              <span className="conversation-preview-row">
                <span className="conversation-preview">{chat.preview}</span>
                {chat.unread > 0 && <span className="unread-count">{chat.unread}</span>}
              </span>
            </span>
          </button>
        ))}
        {visibleChats.length === 0 && (
          <div className="list-empty">
            {chats.length === 0 ? <UsersRound size={20} /> : <Search size={20} />}
            <strong>{chats.length === 0 ? "Belum ada percakapan" : "Tidak ditemukan"}</strong>
            <span>{chats.length === 0 ? "Mulai chat baru atau tunggu pesan masuk." : "Coba nama atau kata lain."}</span>
            <button onClick={onSearchPeople}>{chats.length === 0 ? "Cari pengguna" : "Cari orang"}</button>
          </div>
        )}
        <button className="archived-link" onClick={onSearchPeople}>
          <Archive size={15} />
          Percakapan arsip dan baru
        </button>
      </div>
    </aside>
  );
}
