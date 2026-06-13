"use client";
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`diary-card px-4 py-3 text-sm animate-slide-up ${
            toast.variant === "destructive"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : "bg-[#fffdf7] text-[#3d2b1f]"
          }`}
        >
          {toast.title && <p className="font-semibold">{toast.title}</p>}
          {toast.description && <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}
