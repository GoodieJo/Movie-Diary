"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoFile {
  id: string;
  previewUrl: string;
  uploadedUrl?: string;
  uploading: boolean;
  label?: string;
}

interface PhotoUploadProps {
  entryId?: number;
  onChange?: (urls: string[]) => void;
  onUploaded?: (photo: { id: number; url: string }) => void;
}

export function PhotoUpload({ entryId, onChange, onUploaded }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    const newPhotos: PhotoFile[] = Array.from(files).slice(0, 6).map(file => ({
      id: Math.random().toString(36).slice(2),
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);

    // Upload each file immediately
    for (const photo of newPhotos) {
      const file = Array.from(files).find((_, i) =>
        newPhotos[i]?.id === photo.id
      ) ?? files[newPhotos.indexOf(photo)];

try {
        const formData = new FormData();
        formData.append("file", file);
        if (entryId) formData.append("entry_id", String(entryId));

        const res  = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json() as { url?: string; id?: number };

        setPhotos(prev => {
          const updated = prev.map(p =>
            p.id === photo.id
              ? { ...p, uploadedUrl: data.url, uploading: false }
              : p
          );
          onChange?.(updated.map(p => p.uploadedUrl).filter(Boolean) as string[]);
          return updated;
        });

        if (data.url && data.id) onUploaded?.({ id: data.id, url: data.url });
      } catch {
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, uploading: false } : p
        ));
      }
    }
  }

  function remove(id: string) {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      onChange?.(updated.map(p => p.uploadedUrl).filter(Boolean) as string[]);
      return updated;
    });
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-[#e8dcc8] rounded-xl p-6 text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-colors"
      >
        <Upload size={24} className="mx-auto text-[#c99f7f] mb-2" />
        <p className="text-sm text-[#7a5c47] font-medium">Drop photos here or click to upload</p>
        <p className="text-xs text-[#b8a090] mt-1">Couple selfie, snacks, tickets... 📸</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-2">
            {photos.map(photo => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-[#f0e6d2] group shadow-sm"
              >
                <Image src={photo.previewUrl} alt="Upload preview" fill className="object-cover" unoptimized />
                {photo.uploading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                )}
                {!photo.uploading && !photo.uploadedUrl && (
                  <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                    <p className="text-white text-xs">Failed</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X size={12} className="text-[#3d2b1f]" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}