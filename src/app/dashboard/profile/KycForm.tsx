"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitKyc } from "../actions";

export function KycForm() {
  const router = useRouter();
  const idFileRef   = useRef<HTMLInputElement>(null);
  const selfieRef   = useRef<HTMLInputElement>(null);
  const [idFile,   setIdFile]   = useState<File | null>(null);
  const [selfie,   setSelfie]   = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idFile || !selfie) return;
    setError(null);
    const formData = new FormData();
    formData.append("idDocument", idFile);
    formData.append("selfie", selfie);
    startTransition(async () => {
      try {
        await submitKyc(formData);
        setSubmitted(true);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Impossible de soumettre le KYC.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-success-light border border-success">
        <CheckCircle className="w-5 h-5 text-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-text-primary">Demande soumise</p>
          <p className="text-xs text-text-secondary">Notre équipe examine vos documents sous 24–48h.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-error-light border border-error">
          <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* ID document */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Pièce d&apos;identité *</label>
        <button
          type="button"
          onClick={() => idFileRef.current?.click()}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors text-left ${
            idFile ? "border-brand bg-primary-50" : "border-border hover:border-brand"
          }`}
        >
          <Upload className={`w-5 h-5 shrink-0 ${idFile ? "text-brand" : "text-text-disabled"}`} />
          <span className={`text-sm ${idFile ? "text-brand font-medium" : "text-text-disabled"}`}>
            {idFile ? idFile.name : "Sélectionner votre pièce d'identité"}
          </span>
        </button>
        <input ref={idFileRef} type="file" accept="image/*,application/pdf" className="sr-only"
          onChange={(e) => setIdFile(e.target.files?.[0] ?? null)} />
      </div>

      {/* Selfie */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Selfie avec votre pièce *</label>
        <button
          type="button"
          onClick={() => selfieRef.current?.click()}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors text-left ${
            selfie ? "border-brand bg-primary-50" : "border-border hover:border-brand"
          }`}
        >
          <Upload className={`w-5 h-5 shrink-0 ${selfie ? "text-brand" : "text-text-disabled"}`} />
          <span className={`text-sm ${selfie ? "text-brand font-medium" : "text-text-disabled"}`}>
            {selfie ? selfie.name : "Prendre / sélectionner un selfie"}
          </span>
        </button>
        <input ref={selfieRef} type="file" accept="image/*" capture="user" className="sr-only"
          onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} />
      </div>

      <Button type="submit" size="md" className="w-full" loading={pending}
        disabled={!idFile || !selfie}>
        Soumettre pour vérification
      </Button>

      <p className="text-xs text-text-disabled text-center">
        Vos documents sont chiffrés et supprimés après vérification.
      </p>
    </form>
  );
}
