import type { ChatConversation, Person } from "./chat-types";

export const currentUser: Person = {
  id: "me",
  name: "Anisa Maharani",
  username: "anisa.m",
  avatar:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
  online: true,
  bio: "Menyatukan orang lewat ide-ide kecil ✨",
};

export const conversations: ChatConversation[] = [
  {
    id: "nara",
    kind: "personal",
    name: "Nara Pratama",
    username: "nara.p",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    preview: "Seru banget, sampai ketemu besok ya!",
    time: "14.32",
    unread: 0,
    online: true,
    bio: "Desainer, penikmat kopi, dan selalu ingin belajar.",
    messages: [
      { id: "n1", author: "Nara", text: "Hai Anisa! Gimana acaranya kemarin?", time: "14.18", mine: false },
      { id: "n2", author: "Kamu", text: "Seru banget. Banyak ide baru juga 😄", time: "14.21", mine: true, read: true },
      { id: "n3", author: "Nara", text: "Besok ngopi bareng yuk, ceritain lebih lengkap.", time: "14.28", mine: false },
      { id: "n4", author: "Kamu", text: "Seru banget, sampai ketemu besok ya!", time: "14.32", mine: true, read: true },
    ],
  },
  {
    id: "weekend",
    kind: "group",
    name: "Rencana Jumat",
    avatar:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=160&q=80",
    preview: "Maya: Tempatnya sudah aku pesan ✨",
    time: "13.54",
    unread: 4,
    members: 8,
    currentUserRole: "admin",
    bio: "Teman baik, Jumat yang menyenangkan.",
    messages: [
      { id: "w1", author: "Sonia", text: "Jumat ini ada yang senggang?", time: "13.31", mine: false },
      { id: "w2", author: "Maya", text: "Tempatnya sudah aku pesan ✨", time: "13.54", mine: false },
    ],
  },
  {
    id: "maya",
    kind: "personal",
    name: "Maya Putri",
    username: "maya.p",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80",
    preview: "File-nya sudah kukirim, cek kalau sempat",
    time: "12.46",
    unread: 0,
    online: true,
    bio: "Fotografer. Selalu mencari cahaya di mana pun.",
    messages: [
      { id: "m1", author: "Maya", text: "File-nya sudah kukirim, cek kalau sempat", time: "12.46", mine: false },
    ],
  },
  {
    id: "studio",
    kind: "group",
    name: "Studio Kecil",
    avatar:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=160&q=80",
    preview: "Kamu: Terima kasih semuanya 🙌",
    time: "Kemarin",
    unread: 0,
    members: 12,
    currentUserRole: "owner",
    bio: "Studio kecil dengan ide-ide besar.",
    messages: [
      { id: "s1", author: "Kamu", text: "Terima kasih semuanya 🙌", time: "Kemarin", mine: true, read: true },
    ],
  },
  {
    id: "bima",
    kind: "personal",
    name: "Bima Saputra",
    username: "bima.s",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    preview: "Boleh, nanti kukirim sore ini",
    time: "Kemarin",
    unread: 0,
    online: false,
    bio: "Ngoding, mendaki, mengulang.",
    messages: [
      { id: "b1", author: "Bima", text: "Boleh, nanti kukirim sore ini", time: "Kemarin", mine: false },
    ],
  },
  {
    id: "family",
    kind: "group",
    name: "Keluarga 🤍",
    avatar:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=160&q=80",
    preview: "Ibu: Sayang kalian ❤️",
    time: "Sen",
    unread: 0,
    members: 6,
    currentUserRole: "member",
    messages: [
      { id: "f1", author: "Ibu", text: "Sayang kalian ❤️", time: "Sen", mine: false },
    ],
  },
];

export const friends: Person[] = [
  { id: "nara", name: "Nara Pratama", username: "nara.p", avatar: conversations[0].avatar, online: true, bio: "Desainer, penikmat kopi, dan selalu ingin belajar." },
  { id: "maya", name: "Maya Putri", username: "maya.p", avatar: conversations[2].avatar, online: true, bio: "Fotografer. Selalu mencari cahaya di mana pun." },
  { id: "bima", name: "Bima Saputra", username: "bima.s", avatar: conversations[4].avatar, online: false, bio: "Ngoding, mendaki, mengulang." },
];

export const incomingRequests: Person[] = [
  {
    id: "tiara",
    name: "Tiara Rahman",
    username: "tiara.r",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
    online: true,
    bio: "Seni adalah keajaiban kecil sehari-hari.",
  },
  {
    id: "rizky",
    name: "Rizky Aditya",
    username: "rizky.a",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    online: false,
  },
];
