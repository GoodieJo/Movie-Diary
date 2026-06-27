"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";

const LAST_SEEN_KEY = "album_notifications_last_seen";

interface RecentComment {
  id:         string;
  photo_id:   string;
  author:     string;
  emoji:      string;
  content:    string;
  created_at: string;
  image_url:  string;
}

function timeAgo(dateStr: string): string {
  const utcStr = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z";
  const diff   = Date.now() - new Date(utcStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : dateStr.slice(0, 10);
}

interface Props {
  onOpenPhoto: (photoId: string) => void;
}

export function NotificationBell({ onOpenPhoto }: Props) {
  const [open,      setOpen]      = useState(false);
  const [comments,  setComments]  = useState<RecentComment[]>([]);
  const [unread,    setUnread]    = useState(0);
  const [loading,   setLoading]   = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load last seen timestamp
  function getLastSeen(): number {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(LAST_SEEN_KEY) ?? "0", 10);
  }

  function markAllRead() {
    localStorage.setItem(LAST_SEEN_KEY, Date.now().toString());
    setUnread(0);
  }

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/album/notifications");
      if (!res.ok) return;
      const data = await res.json() as { data: RecentComment[] };
      const list = data.data ?? [];
      setComments(list);

      // Count unread — comments newer than last seen
      const lastSeen = getLastSeen();
      const unreadCount = list.filter(c => {
        const utcStr = c.created_at.includes("T")
          ? c.created_at
          : c.created_at.replace(" ", "T") + "Z";
        return new Date(utcStr).getTime() > lastSeen;
      }).length;
      setUnread(unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleOpen() {
    setOpen(o => !o);
    if (!open) markAllRead();
  }

  function handleClickComment(comment: RecentComment) {
    setOpen(false);
    onOpenPhoto(comment.photo_id);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-[#e8dcc8] hover:border-rose-300 hover:bg-rose-50 transition-colors shadow-sm"
      >
        <Bell size={18} className={unread > 0 ? "text-rose-400" : "text-[#9e7a60]"} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      {/* Notification panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 w-80 bg-[#fffdf7] border border-[#e8dcc8] rounded-2xl shadow-lift z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0e6d2]">
              <h3 className="font-display font-semibold text-[#3d2b1f] text-sm">
                Recent Comments
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-[#f0e6d2] transition-colors"
              >
                <X size={14} className="text-[#9e7a60]" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="flex justify-center gap-1">
                    {[0,1,2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-rose-300 rounded-full"
                        animate={{ y: [0,-5,0] }}
                        transition={{ duration: 0.5, delay: i*0.1, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-2xl mb-1">💬</p>
                  <p className="text-sm text-[#9e7a60]">No comments yet</p>
                </div>
              ) : (
                comments.map(c => {
                  const utcStr = c.created_at.includes("T")
                    ? c.created_at
                    : c.created_at.replace(" ", "T") + "Z";
                  const isNew = new Date(utcStr).getTime() > getLastSeen();

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleClickComment(c)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#fdf5e8] transition-colors border-b border-[#f5ede4] last:border-0 text-left"
                    >
                      {/* Photo thumbnail */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-[#f0e6d2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLImageElement).src = "/placeholder-poster.svg";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#3d2b1f] flex items-center gap-1">
                          <span>{c.emoji}</span>
                          {c.author}
                          {isNew && (
                            <span className="ml-1 w-1.5 h-1.5 bg-rose-400 rounded-full inline-block" />
                          )}
                        </p>
                        <p className="text-xs text-[#7a5c47] truncate handwriting mt-0.5">
                          {c.content}
                        </p>
                        <p className="text-[10px] text-[#b8a090] mt-0.5">
                          {timeAgo(c.created_at)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}