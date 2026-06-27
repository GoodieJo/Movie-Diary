"use client";
import { useState, useEffect } from "react";

export interface PersonSettings {
  person1_name:  string;
  person1_emoji: string;
  person2_name:  string;
  person2_emoji: string;
}

const DEFAULTS: PersonSettings = {
  person1_name:  "Him",
  person1_emoji: "🫘",
  person2_name:  "Her",
  person2_emoji: "🌻",
};

let _cache: PersonSettings | null = null;
const _listeners: Array<(s: PersonSettings) => void> = [];

export function useSettings() {
  const [settings, setSettings] = useState<PersonSettings>(_cache ?? DEFAULTS);

  useEffect(() => {
    _listeners.push(setSettings);
    if (!_cache) {
      fetch("/api/settings")
        .then(r => r.json() as Promise<{ data: Record<string, string> }>)
        .then(({ data }) => {
          const s: PersonSettings = {
            person1_name:  data.person1_name  ?? DEFAULTS.person1_name,
            person1_emoji: data.person1_emoji ?? DEFAULTS.person1_emoji,
            person2_name:  data.person2_name  ?? DEFAULTS.person2_name,
            person2_emoji: data.person2_emoji ?? DEFAULTS.person2_emoji,
          };
          _cache = s;
          _listeners.forEach(l => l(s));
        })
        .catch(() => {});
    }
    return () => {
      const i = _listeners.indexOf(setSettings);
      if (i !== -1) _listeners.splice(i, 1);
    };
  }, []);

  async function saveSettings(updates: Partial<PersonSettings>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const { data } = await res.json() as { data: Record<string, string> };
    const s: PersonSettings = {
      person1_name:  data.person1_name  ?? DEFAULTS.person1_name,
      person1_emoji: data.person1_emoji ?? DEFAULTS.person1_emoji,
      person2_name:  data.person2_name  ?? DEFAULTS.person2_name,
      person2_emoji: data.person2_emoji ?? DEFAULTS.person2_emoji,
    };
    _cache = s;
    _listeners.forEach(l => l(s));
  }

  return { settings, saveSettings };
}