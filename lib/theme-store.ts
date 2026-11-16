"use client";

import { useSyncExternalStore } from "react";
import type { ThemeMode } from "@/lib/chat-types";

const storageKey = "koneksi-theme";
const subscribers = new Set<() => void>();

function subscribe(callback: () => void) {
  subscribers.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): ThemeMode {
  const saved = window.localStorage.getItem(storageKey);
  return saved === "light" || saved === "system" ? saved : "dark";
}

function getServerSnapshot(): ThemeMode {
  return "dark";
}

function updateTheme(theme: ThemeMode) {
  window.localStorage.setItem(storageKey, theme);
  subscribers.forEach((callback) => callback());
}

export function useThemePreference(): [ThemeMode, (theme: ThemeMode) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [theme, updateTheme];
}
