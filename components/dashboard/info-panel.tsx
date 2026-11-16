"use client";

import {
  Bell,
  ChevronRight,
  FileText,
  Image as ImageIcon,
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
          <span className={`status-dot${conversation.online ? "" : " offline"}`} />
          {conversation.online ? "Sedang online" : "Offline"}
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
            {[conversation.name.split(" ")[0], "Maya", "Sonia", "Bima"].map((name, index) => (
              <div className="member-row" key={`${name}-${index}`}>
                <Avatar name={name} size="sm" online={index < 2} />
                <div><strong>{name}</strong><span>{index === 0 ? "Pemilik" : index === 1 ? "Admin" : "Anggota"}</span></div>
                <button aria-label={`Opsi untuk ${name}`} onClick={() => onAction(`Opsi anggota ${name}`)}><MoreHorizontal size={16} /></button>
              </div>
            ))}
            {canManageGroup && <button className="add-member" onClick={onAddMembers}><UsersRound size={15} /> Tambah anggota</button>}
          </div>
        ) : (
          <div className="shared-grid">
            <div className="shared-item"><span><ImageIcon size={18} /></span><strong>Foto</strong><small>12 item</small></div>
            <div className="shared-item"><span><FileText size={18} /></span><strong>File</strong><small>3 item</small></div>
          </div>
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
