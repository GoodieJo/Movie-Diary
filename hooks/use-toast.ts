"use client";
import { useState, useCallback } from "react";

type ToastVariant = "default" | "destructive";
interface Toast { id: string; title?: string; description?: string; variant?: ToastVariant; }

let listeners: Array<(toasts: Toast[]) => void> = [];
let toastList: Toast[] = [];

function notify() { listeners.forEach((l) => l([...toastList])); }

export function toast(t: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  toastList = [...toastList, { ...t, id }];
  notify();
  setTimeout(() => {
    toastList = toastList.filter((x) => x.id !== id);
    notify();
  }, 3500);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useState(() => {
    listeners.push(setToasts);
    return () => { listeners = listeners.filter((l) => l !== setToasts); };
  });
  return { toasts, toast };
}
