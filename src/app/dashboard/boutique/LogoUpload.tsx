"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadShopLogo } from "../actions";

interface LogoUploadProps {
  shopId: string;
  currentLogo?: string;
  shopName: string;
}

export function LogoUpload({ shopId, currentLogo, shopName }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    setPreview(url);

    const formData = new FormData();
    formData.append("logo", file);
    startTransition(async () => {
      try {
        await uploadShopLogo(shopId, formData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Échec du téléchargement.");
        setPreview(currentLogo ?? null);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-secondary">Logo de la boutique</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-border hover:border-brand transition-colors group shrink-0"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-50 text-2xl font-bold text-brand">
              {shopName[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {pending
              ? <Loader2 className="w-6 h-6 text-white animate-spin" />
              : <Camera className="w-6 h-6 text-white" />
            }
          </div>
        </button>

        <div className="space-y-1">
          <p className="text-sm text-text-secondary">Cliquez pour changer le logo</p>
          <p className="text-xs text-text-disabled">PNG, JPG · max 5 Mo · 400×400 recommandé</p>
          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
