"use client";
export const runtime = "edge";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/album/useSettings";
import { NotificationToggle } from "@/components/settings/NotificationToggle";
import { toast } from "@/hooks/use-toast";
import { LogOut, Save } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#3d2b1f]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#b8a090]">{hint}</p>}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
    />
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { settings, saveSettings } = useSettings();
  const [saving, setSaving] = useState(false);

  const [p1Name,  setP1Name]  = useState(settings.person1_name);
  const [p1Emoji, setP1Emoji] = useState(settings.person1_emoji);
  const [p2Name,  setP2Name]  = useState(settings.person2_name);
  const [p2Emoji, setP2Emoji] = useState(settings.person2_emoji);

  // Sync local state when settings load
  useState(() => {
    setP1Name(settings.person1_name);
    setP1Emoji(settings.person1_emoji);
    setP2Name(settings.person2_name);
    setP2Emoji(settings.person2_emoji);
  });

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings({
        person1_name:  p1Name  || "Him",
        person1_emoji: p1Emoji || "🫘",
        person2_name:  p2Name  || "Her",
        person2_emoji: p2Emoji || "🌻",
      });
      toast({ title: "Saved! 💕", description: "Your settings have been updated." });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 text-sm text-[#9e7a60] hover:text-[#3d2b1f] transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-display text-3xl font-bold text-[#3d2b1f]">Settings ⚙️</h1>
        <p className="handwriting text-rose-400 text-lg mt-1">make it yours 💕</p>
      </motion.div>

      {/* Names section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="diary-card p-5 space-y-5"
      >
        <div>
          <h2 className="font-display font-semibold text-[#3d2b1f] text-lg">👥 Our Names</h2>
          <p className="text-xs text-[#9e7a60] mt-1">These names appear when you comment on photos.</p>
        </div>

        {/* Person 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#3d2b1f]">
            <span className="text-xl">{p1Emoji || "🫘"}</span>
            <span>{p1Name || "Him"}</span>
            <span className="text-xs text-[#b8a090] font-normal ml-1">— Person 1</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Name">
                <Input
                  value={p1Name}
                  onChange={e => setP1Name(e.target.value)}
                  placeholder="Him"
                  maxLength={20}
                />
              </Field>
            </div>
            <Field label="Emoji" hint="Paste any emoji">
              <Input
                value={p1Emoji}
                onChange={e => setP1Emoji(e.target.value)}
                placeholder="🫘"
                maxLength={4}
                className="text-center text-xl"
              />
            </Field>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#f0e6d2]" />

        {/* Person 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#3d2b1f]">
            <span className="text-xl">{p2Emoji || "🌻"}</span>
            <span>{p2Name || "Her"}</span>
            <span className="text-xs text-[#b8a090] font-normal ml-1">— Person 2</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Name">
                <Input
                  value={p2Name}
                  onChange={e => setP2Name(e.target.value)}
                  placeholder="Her"
                  maxLength={20}
                />
              </Field>
            </div>
            <Field label="Emoji" hint="Paste any emoji">
              <Input
                value={p2Emoji}
                onChange={e => setP2Emoji(e.target.value)}
                placeholder="🌻"
                maxLength={4}
                className="text-center text-xl"
              />
            </Field>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#fdf5e8] border border-[#e8dcc8] rounded-xl p-3">
          <p className="text-xs text-[#9e7a60] mb-2 font-medium">Preview</p>
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
              {p1Emoji || "🫘"} {p1Name || "Him"}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1">
              {p2Emoji || "🌻"} {p2Name || "Her"}
            </span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold transition-colors shadow-sm disabled:opacity-60"
        >
          {saving ? "Saving…" : <><Save size={16} /> Save Changes</>}
        </button>
      </motion.div>

      {/* Notifications section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="diary-card p-5 space-y-3"
      >
        <div>
          <h2 className="font-display font-semibold text-[#3d2b1f] text-lg">🔔 Notifications</h2>
          <p className="text-sm text-[#9e7a60] mt-1">
            Get notified on this device for new diary entries, memories, and comments from the other person.
          </p>
        </div>
        <NotificationToggle />
      </motion.div>

      {/* Diary / Logout section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="diary-card p-5 space-y-3"
      >
        <h2 className="font-display font-semibold text-[#3d2b1f] text-lg">🔒 Diary</h2>
        <p className="text-sm text-[#9e7a60]">Lock the diary and return to the cover page.</p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#f5ede4] hover:bg-[#ead8c8] text-[#3d2b1f] rounded-xl font-medium border border-[#e8dcc8] transition-colors"
        >
          <LogOut size={16} /> Lock Diary
        </button>
      </motion.div>
    </div>
  );
}