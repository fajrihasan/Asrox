export type ChatKind = "personal" | "group";
export type GroupRole = "owner" | "admin" | "member";
export type ThemeMode = "dark" | "light" | "system";
export type AppSection =
  | "chats"
  | "friends"
  | "requests"
  | "notifications"
  | "profile"
  | "settings";

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  time: string;
  mine: boolean;
  read?: boolean;
}

export interface ChatConversation {
  id: string;
  kind: ChatKind;
  name: string;
  username?: string;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
  online?: boolean;
  members?: number;
  currentUserRole?: GroupRole;
  bio?: string;
  messages: ChatMessage[];
}

export interface Person {
  id: string;
  name: string;
  username: string;
  avatar: string;
  online: boolean;
  bio?: string;
}
