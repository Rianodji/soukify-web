"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitKyc } from "../actions";

const DOCUMENT_TYPES = [
  { value: "CNI",      label: "Carte nationale d'identité" },
  { value: "PASSPORT", label: "Passeport" },
];

const todayISO = () => new Date().toISOString().split("T")[0];

export function KycForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState("CNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!file && documentNumber.trim().length >= 4 && !!issueDate && !!expirationDate;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setError(null);
    const formData = new FormData();
    formData.append("documentType", documentType);
    formData.append("documentNumber", documentNumber.trim());
    formData.append("issueDate", issueDate);
    formData.append("expirationDate", expirationDate);
    formData.append("file", file);
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

      {/* Document type */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Type de document *</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-border bg-white text-sm text-text-primary focus:outline-none focus:border-brand"
        >
          {DOCUMENT_TYPES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Document number */}
      <Input
        label="Numéro du document *"
        value={documentNumber}
        onChange={(e) => setDocumentNumber(e.target.value)}
        placeholder="Ex : 1234567890"
        minLength={4}
        maxLength={50}
        required
      />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label="Date de délivrance *"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          max={todayISO()}
          required
        />
        <Input
          type="date"
          label="Date d'expiration *"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          min={todayISO()}
          required
        />
      </div>

      {/* Document file */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Photo ou scan du document (PDF accepté) *</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors text-left ${
            file ? "border-brand bg-primary-50" : "border-border hover:border-brand"
          }`}
        >
          <Upload className={`w-5 h-5 shrink-0 ${file ? "text-brand" : "text-text-disabled"}`} />
          <span className={`text-sm ${file ? "text-brand font-medium" : "text-text-disabled"}`}>
            {file ? file.name : "Sélectionner une photo ou un PDF de votre document"}
          </span>
        </button>
        {/* API accepts JPEG/PNG/PDF (magic-byte-validated server-side, cf. HANDOFF_INFRA.md, 2026-07-26). */}
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 5 * 1024 * 1024) {
              setError("Le fichier ne doit pas dépasser 5 Mo.");
              e.target.value = "";
              setFile(null);
              return;
            }
            setError(null);
            setFile(f);
          }} />
      </div>

      <Button type="submit" size="md" className="w-full" loading={pending}
        disabled={!canSubmit}>
        Soumettre pour vérification
      </Button>
    </form>
  );
}
