"use client";

import {
  ArrowDown,
  Check,
  CheckCheck,
  ChevronLeft,
  Info,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ChatConversation } from "@/lib/chat-types";
import { Avatar } from "@/components/ui/avatar";

interface ConversationViewProps {
  conversation: ChatConversation;
  loading?: boolean;
  onToggleDetails: () => void;
  onBack: () => void;
  onSend: (text: string) => Promise<boolean>;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, text: string) => Promise<boolean>;
}

export function ConversationView({
  conversation,
  loading = false,
  onToggleDetails,
  onBack,
  onSend,
  onDelete,
  onEdit,
}: ConversationViewProps) {
  const [draft, setDraft] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const filteredMessages = useMemo(() => {
    const query = messageSearch.trim().toLocaleLowerCase();
    return conversation.messages.filter((message) => message.text.toLocaleLowerCase().includes(query));
  }, [conversation.messages, messageSearch]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const saved = editing
      ? await onEdit(editing, text)
      : await onSend(text);
    if (!saved) return;

    if (editing) {
      setEditing(null);
    }
    setDraft("");
    setShowEmoji(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <main className="conversation-panel">
      <header className="conversation-header">
        <button className="mobile-back" onClick={onBack} aria-label="Kembali ke percakapan"><ChevronLeft size={18} /></button>
        <Avatar
          src={conversation.avatar}
          name={conversation.name}
          online={conversation.online}
          group={conversation.kind === "group"}
        />
        <button className="conversation-identity" onClick={onToggleDetails}>
          <strong>{conversation.name}</strong>
          <span>
            {conversation.kind === "group"
              ? `${conversation.members ?? 0} anggota`
              : conversation.online === undefined
                ? "Status online belum tersedia"
                : conversation.online
                  ? "Sedang online"
                  : "Offline"}
          </span>
        </button>
        <div className="header-actions">
          <button
            className={`icon-button header-icon${searchOpen ? " selected" : ""}`}
            onClick={() => setSearchOpen((value) => !value)}
            aria-label="Cari dalam percakapan"
            title="Cari dalam percakapan"
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>
          <button className="icon-button header-icon hide-small" aria-label="Panggilan suara segera hadir" title="Panggilan suara segera hadir" disabled>
            <Phone size={18} />
          </button>
          <button className="icon-button header-icon hide-small" aria-label="Panggilan video segera hadir" title="Panggilan video segera hadir" disabled>
            <Video size={19} />
          </button>
          <span className="header-divider" />
          <button
            className="icon-button header-icon info-toggle"
            onClick={onToggleDetails}
            aria-label="Detail percakapan"
            title="Detail percakapan"
          >
            <Info size={19} />
          </button>
          <button className="icon-button header-icon hide-small" aria-label="Lainnya">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="message-search-bar">
          <Search size={16} />
          <input
            autoFocus
            value={messageSearch}
            onChange={(event) => setMessageSearch(event.target.value)}
            placeholder="Cari di percakapan ini"
            aria-label="Cari di percakapan ini"
          />
          <span>{filteredMessages.length} hasil</span>
          <button className="icon-button" onClick={() => { setMessageSearch(""); setSearchOpen(false); }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="message-feed" aria-live="polite">
        {loading && <div className="message-no-results">Memuat riwayat pesan...</div>}
        {filteredMessages.map((message, index) => {
          const previous = filteredMessages[index - 1];
          const showAuthor = conversation.kind === "group" && (!previous || previous.author !== message.author);
          return (
            <div key={message.id} className={`message-row ${message.mine ? "mine" : "theirs"}`}>
              {!message.mine && conversation.kind === "group" && (
                <Avatar src={conversation.avatar} name={message.author} size="sm" />
              )}
              <div className="message-stack">
                {showAuthor && <span className="message-author">{message.author}</span>}
                <div className="message-with-actions">
                  <div className={`message-bubble ${message.mine ? "mine-bubble" : "theirs-bubble"}`}>
                    {message.text}
                  </div>
                  {message.mine && (
                    <div className="message-actions">
                      <button
                        title="Edit"
                        aria-label="Edit pesan"
                        onClick={() => { setDraft(message.text); setEditing(message.id); }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      <button
                        title="Hapus"
                        aria-label="Hapus pesan"
                        onClick={() => onDelete(message.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <span className="message-meta">
                  {message.time}
                  {message.mine && (message.read ? <CheckCheck size={14} className="read-check" /> : <Check size={14} />)}
                </span>
              </div>
            </div>
          );
        })}
        {!loading && filteredMessages.length === 0 && (messageSearch.trim()
          ? <div className="message-no-results">Tidak ada pesan yang cocok dengan kata ini.</div>
          : <div className="conversation-empty"><span><MessageCircle size={21} /></span><strong>Belum ada pesan di sini</strong><p>Sapa duluan untuk memulai obrolan.</p></div>)}
      </div>

      <div className="composer-wrap">
        {editing && (
          <div className="editing-hint">
            <span>Mengedit pesan</span>
            <button onClick={() => { setEditing(null); setDraft(""); }}>Batal</button>
          </div>
        )}
        {showEmoji && (
          <div className="emoji-popover">
            {["😊", "😂", "❤️", "🙌", "✨", "👋", "🥹", "🎉"].map((emoji) => (
              <button key={emoji} onClick={() => setDraft((value) => `${value}${emoji}`)}>{emoji}</button>
            ))}
          </div>
        )}
        <form className="message-composer" onSubmit={submitMessage}>
          <button type="button" className="icon-button composer-tool" aria-label="Lampiran belum tersedia" title="Lampiran belum terhubung ke Storage" disabled>
            <Paperclip size={19} />
          </button>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan..."
            aria-label="Tulis pesan"
            rows={1}
          />
          <div className="composer-tools">
            <button type="button" className={`icon-button composer-tool${showEmoji ? " selected" : ""}`} onClick={() => setShowEmoji((value) => !value)} aria-label="Tambahkan emoji">
              <Smile size={19} />
            </button>
            <button type="submit" className="send-button" disabled={!draft.trim()} aria-label="Kirim pesan">
              <Send size={17} />
            </button>
          </div>
        </form>
        <div className="composer-caption">Enter untuk mengirim <span>·</span> Shift + Enter untuk baris baru</div>
      </div>
      <button className="scroll-bottom" aria-label="Ke pesan terbaru"><ArrowDown size={16} /></button>
    </main>
  );
}
