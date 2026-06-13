"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoFile {
  id: string;
  url: string;
  file?: File;
  label?: string;
}

interface PhotoUploadProps {
  entryId?: number;
  onChange?: (urls: string[]) => void;
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PhotoUpload({ entryId: _entryId, onChange }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    const newPhotos: PhotoFile[] = [];

    for (const file of Array.from(files).slice(0, 6)) {
      const url = URL.createObjectURL(file);
      newPhotos.push({ id: Math.random().toString(36).slice(2), url, file });
    }

    setPhotos(prev => {
      const updated = [...prev, ...newPhotos];
      onChange?.(updated.map(p => p.url));
      return updated;
    });
  }

  function remove(id: string) {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      onChange?.(updated.map(p => p.url));
      return updated;
    });
  }

  return (
    <div className="space-y-3">
      {/* Upload area */}
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

      {/* Preview grid */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-2"
          >
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-[#f0e6d2] group shadow-sm"
              >
                <Image
                  src={photo.url}
                  alt="Upload preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
