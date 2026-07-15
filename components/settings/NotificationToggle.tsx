"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AUTHOR_KEY = "album_last_author";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  const bytes   = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type Status = "loading" | "unsupported" | "enabled" | "disabled" | "denied";

export function NotificationToggle() {
  const [status, setStatus]   = useState<Status>("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "enabled" : "disabled");
    }
    check().catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "disabled");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Push notifications aren't configured yet.");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const person = localStorage.getItem(AUTHOR_KEY) === "2" ? "2" : "1";
      const json = sub.toJSON();

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person,
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      if (!res.ok) throw new Error("Failed to save subscription");

      setStatus("enabled");
      toast({ title: "Notifications on 🔔", description: "You'll be notified of new entries, memories, and comments." });
    } catch (e) {
      toast({ title: "Couldn't enable notifications", description: String(e), variant: "destructive" });
    } finally {
      setWorking(false);
    }
  }

  async function disable() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("disabled");
      toast({ title: "Notifications off" });
    } catch (e) {
      toast({ title: "Couldn't disable notifications", description: String(e), variant: "destructive" });
    } finally {
      setWorking(false);
    }
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-[#9e7a60]">
        Notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-[#9e7a60]">
        Notifications are blocked for this site. Enable them in your browser&apos;s site settings to turn this on.
      </p>
    );
  }

  return (
    <button
      onClick={status === "enabled" ? disable : enable}
      disabled={status === "loading" || working}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium border transition-colors disabled:opacity-60 ${
        status === "enabled"
          ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
          : "bg-[#f5ede4] border-[#e8dcc8] text-[#3d2b1f] hover:bg-[#ead8c8]"
      }`}
    >
      {working ? (
        <Loader2 size={16} className="animate-spin" />
      ) : status === "enabled" ? (
        <Bell size={16} />
      ) : (
        <BellOff size={16} />
      )}
      {status === "loading"
        ? "Checking…"
        : status === "enabled"
        ? "Notifications On — tap to turn off"
        : "Enable Notifications"}
    </button>
  );
}
