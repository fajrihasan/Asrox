"use client";

import {
  Bell,
  ChevronRight,
  Link2,
  LogOut,
  MoreHorizontal,
  Pencil,
  Pin,
  Search,
  Shield,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ChatConversation } from "@/lib/chat-types";
import { Avatar } from "@/components/ui/avatar";

interface InfoPanelProps {
  conversation: ChatConversation;
  onClose: () => void;
  onAction: (message: string) => void;
  onAddMembers: () => void;
  onEditGroup: () => void;
  onLeaveGroup: () => void;
}

export function InfoPanel({ conversation, onClose, onAction, onAddMembers, onEditGroup, onLeaveGroup }: InfoPanelProps) {
  const [muted, setMuted] = useState(false);
  const [searching, setSearching] = useState(false);
  const canManageGroup = conversation.currentUserRole === "owner" || conversation.currentUserRole === "admin";
  return (
    <aside className="info-panel">
      <header className="info-panel-header">
        <strong>Detail</strong>
        <button className="icon-button" onClick={onClose} aria-label="Tutup detail"><X size={18} /></button>
      </header>
      <div className="profile-summary">
        <Avatar src={conversation.avatar} name={conversation.name} size="xl" group={conversation.kind === "group"} online={conversation.online} />
        <h2>{conversation.name}</h2>
        <p>{conversation.kind === "group" ? `${conversation.members ?? 0} anggota` : `@${conversation.username ?? "teman"}`}</p>
        <div className="profile-status">
          {conversation.online !== undefined && <span className={`status-dot${conversation.online ? "" : " offline"}`} />}
          {conversation.online === undefined
            ? "Status online belum tersedia"
            : conversation.online
              ? "Sedang online"
              : "Offline"}
        </div>
        <p className="profile-bio">{conversation.bio ?? "Menciptakan kenangan baik bersama."}</p>
        <div className="profile-actions">
          <button onClick={() => { setSearching((value) => !value); onAction("Gunakan tombol pencarian di bagian atas untuk mencari pesan."); }}><Search size={16} /> {searching ? "Cari pesan" : "Cari"}</button>
          <button onClick={() => setMuted((value) => !value)}><Bell size={16} /> {muted ? "Aktifkan suara" : "Bisukan"}</button>
        </div>
      </div>

      <div className="info-section">
        <div className="info-section-heading">
          <span>{conversation.kind === "group" ? "Anggota grup" : "File bersama"}</span>
          <ChevronRight size={16} />
        </div>
        {conversation.kind === "group" ? (
          <div className="member-list">
            {conversation.participants?.map((member) => (
              <div className="member-row" key={member.id}>
                <Avatar src={member.avatar} name={member.name} size="sm" online={member.online} />
                <div><strong>{member.name}</strong><span>{member.role === "owner" ? "Pemilik" : member.role === "admin" ? "Admin" : "Anggota"}</span></div>
                <button aria-label={`Opsi untuk ${member.name}`} onClick={() => onAction(`Pengelolaan anggota belum tersedia.`)}><MoreHorizontal size={16} /></button>
              </div>
            ))}
            {!conversation.participants?.length && <p>Daftar anggota belum tersedia.</p>}
            {canManageGroup && <button className="add-member" onClick={onAddMembers}><UsersRound size={15} /> Tambah anggota</button>}
          </div>
        ) : (
          <div className="shared-grid">Belum ada media yang dibagikan.</div>
        )}
      </div>

      <div className="info-section">
        <div className="info-section-heading"><span>Pengaturan percakapan</span></div>
        <button className="info-setting" onClick={() => onAction("Belum ada pesan yang disematkan.")}><Pin size={16} /> Pesan disematkan <ChevronRight size={15} /></button>
        <button className="info-setting" onClick={() => onAction("Tautan bersama akan muncul di sini.")}><Link2 size={16} /> Tautan bersama <ChevronRight size={15} /></button>
        {conversation.kind === "group" && canManageGroup && (
          <>
            <button className="info-setting" onClick={onEditGroup}><Pencil size={16} /> Edit grup <ChevronRight size={15} /></button>
            <button className="info-setting" onClick={() => onAction("Pengaturan izin anggota akan segera tersedia.")}><Shield size={16} /> Izin anggota <ChevronRight size={15} /></button>
          </>
        )}
        {conversation.kind === "group" && <button className="info-setting danger-setting" onClick={onLeaveGroup}><LogOut size={16} /> Keluar dari grup <ChevronRight size={15} /></button>}
      </div>
    </aside>
  );
}
