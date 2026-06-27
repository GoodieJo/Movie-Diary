"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CornerDownRight, Pencil, Trash2, Loader2 } from "lucide-react";
import { useSettings } from "./useSettings";
import { formatShortDate } from "@/lib/utils";

interface Comment {
  id:         string;
  photo_id:   string;
  author:     string;
  emoji:      string;
  content:    string;
  parent_id:  string | null;
  created_at: string;
  edited_at:  string | null;
}

interface Props {
  photoId:  string;
  onClose:  () => void;
}

const AUTHOR_KEY = "album_last_author";

function timeAgo(dateStr: string): string {
  // SQLite stores UTC without Z suffix — append Z to force correct UTC parsing
  const utcStr = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z";
  const diff   = Date.now() - new Date(utcStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return formatShortDate(dateStr.slice(0, 10));
}

export function CommentPanel({ photoId, onClose }: Props) {
  const { settings } = useSettings();
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [content,     setContent]     = useState("");
  const [replyTo,     setReplyTo]     = useState<Comment | null>(null);
  const [editTarget,  setEditTarget]  = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);

  const savedAuthor = typeof window !== "undefined" ? localStorage.getItem(AUTHOR_KEY) : null;
  const [author, setAuthor] = useState<"1" | "2">(
    savedAuthor === "2" ? "2" : "1"
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const p1 = { name: settings.person1_name, emoji: settings.person1_emoji };
  const p2 = { name: settings.person2_name, emoji: settings.person2_emoji };
  const person = author === "1" ? p1 : p2;

  useEffect(() => {
    fetch(`/api/album/${photoId}/comments`)
      .then(r => r.json() as Promise<{ data: Comment[] }>)
      .then(d => setComments(d.data ?? []))
      .finally(() => setLoading(false));
  }, [photoId]);

  function selectAuthor(a: "1" | "2") {
    setAuthor(a);
    localStorage.setItem(AUTHOR_KEY, a);
  }

  async function handleSubmit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/album/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author:    person.name,
          emoji:     person.emoji,
          content:   content.trim(),
          parent_id: replyTo?.id ?? null,
        }),
      });
      const { data } = await res.json() as { data: Comment };
      setComments(prev => [...prev, data]);
      setContent("");
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(comment: Comment) {
    if (!editContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/album/${photoId}/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      const { data } = await res.json() as { data: Comment };
      setComments(prev => prev.map(c => c.id === data.id ? data : c));
      setEditTarget(null);
      setEditContent("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(comment: Comment) {
    setDeleting(comment.id);
    await fetch(`/api/album/${photoId}/comments/${comment.id}`, { method: "DELETE" });
    setComments(prev => prev.filter(c => c.id !== comment.id && c.parent_id !== comment.id));
    setDeleting(null);
  }

  // Thread: top-level + their replies
  const topLevel = comments.filter(c => !c.parent_id);
  const replies  = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  function CommentBubble({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
    const isP1      = comment.author === settings.person1_name;
    const isEditing = editTarget?.id === comment.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col gap-1 ${isReply ? "ml-6 pl-3 border-l-2 border-[#f0e6d2]" : ""}`}
      >
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            isP1
              ? "bg-blue-50 border border-blue-100"
              : "bg-rose-50 border border-rose-100"
          }`}
        >
          {/* Author row */}
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold flex items-center gap-1 ${
              isP1 ? "text-blue-600" : "text-rose-500"
            }`}>
              <span>{comment.emoji}</span>
              {comment.author}
              {comment.edited_at && (
                <span className="text-[10px] font-normal opacity-60">(edited)</span>
              )}
            </span>
            <span className="text-[10px] text-[#b8a090]">{timeAgo(comment.created_at)}</span>
          </div>

          {/* Content or edit input */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={2}
                autoFocus
                className="w-full text-sm text-[#3d2b1f] bg-white border border-[#e8dcc8] rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-rose-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(comment)}
                  disabled={submitting}
                  className="text-xs px-3 py-1 bg-rose-400 text-white rounded-full hover:bg-rose-500 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditTarget(null); setEditContent(""); }}
                  className="text-xs px-3 py-1 bg-[#f0e6d2] text-[#7a5c47] rounded-full hover:bg-[#e8dcc8] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="handwriting text-[#3d2b1f] text-base leading-snug">{comment.content}</p>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-3 px-1">
            {!isReply && (
              <button
                onClick={() => { setReplyTo(comment); inputRef.current?.focus(); }}
                className="text-[11px] text-[#9e7a60] hover:text-rose-400 flex items-center gap-0.5 transition-colors"
              >
                <CornerDownRight size={11} /> Reply
              </button>
            )}
            <button
              onClick={() => { setEditTarget(comment); setEditContent(comment.content); }}
              className="text-[11px] text-[#9e7a60] hover:text-[#3d2b1f] flex items-center gap-0.5 transition-colors"
            >
              <Pencil size={11} /> Edit
            </button>
            <button
              onClick={() => handleDelete(comment)}
              disabled={deleting === comment.id}
              className="text-[11px] text-[#9e7a60] hover:text-rose-500 flex items-center gap-0.5 transition-colors"
            >
              {deleting === comment.id
                ? <Loader2 size={11} className="animate-spin" />
                : <Trash2 size={11} />
              }
              Delete
            </button>
          </div>
        )}

        {/* Replies */}
        {replies(comment.id).map(r => (
          <CommentBubble key={r.id} comment={r} isReply />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        onClick={e => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg bg-[#fffdf7] rounded-t-3xl flex flex-col"
        style={{ maxHeight: "75vh", border: "1px solid #e8dcc8" }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#e8dcc8] rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0e6d2] flex-shrink-0">
          <h3 className="font-display font-semibold text-[#3d2b1f]">
            Comments {comments.length > 0 && <span className="text-[#9e7a60] font-normal text-sm">({comments.length})</span>}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0e6d2] transition-colors">
            <X size={17} className="text-[#9e7a60]" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="animate-spin text-rose-300" />
            </div>
          ) : topLevel.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">💬</p>
              <p className="handwriting text-rose-400 text-lg">be the first to comment</p>
              <p className="text-xs text-[#b8a090] mt-1">share what this moment means to you</p>
            </div>
          ) : (
            <AnimatePresence>
              {topLevel.map(c => <CommentBubble key={c.id} comment={c} />)}
            </AnimatePresence>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[#f0e6d2] px-4 pt-3 pb-4 flex-shrink-0 space-y-2">
          {/* Author picker */}
          <div className="flex gap-2">
            {(["1", "2"] as const).map(a => {
              const p = a === "1" ? p1 : p2;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => selectAuthor(a)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    author === a
                      ? a === "1"
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-rose-50 border-rose-300 text-rose-600"
                      : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                  }`}
                >
                  <span>{p.emoji}</span> {p.name}
                </button>
              );
            })}
          </div>

          {/* Reply indicator */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-[#9e7a60] bg-[#f5ede4] rounded-lg px-3 py-1.5"
              >
                <CornerDownRight size={12} />
                Replying to {replyTo.emoji} {replyTo.author}
                <button onClick={() => setReplyTo(null)} className="ml-auto">
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text input + send */}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
              }}
              placeholder={`${person.emoji} ${person.name} says…`}
              rows={1}
              className="flex-1 px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition resize-none handwriting text-base"
              style={{ minHeight: 42, maxHeight: 100 }}
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="flex-shrink-0 w-10 h-10 bg-rose-400 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 shadow-sm"
            >
              {submitting
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />
              }
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}