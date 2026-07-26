"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importShopCsv } from "../actions";

interface CsvImportProps {
  shopId: string;
}

export function CsvImport({ shopId }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setError("Seuls les fichiers .csv sont acceptés.");
      return;
    }
    /* API caps every upload (KYC, logo, annonce images, CSV) at 5 MB —
     * confirmed against the real multer-level limit, cf. HANDOFF_INFRA.md,
     * 2026-07-27. Fail fast client-side instead of waiting for a 413. */
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }
    setError(null);
    setResult(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      try {
        const res = await importShopCsv(shopId, formData);
        setResult(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Échec de l'import CSV.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-medium text-text-primary text-sm">Import CSV en masse</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Importez plusieurs annonces en une seule fois via un fichier CSV.
          </p>
        </div>
        <Button size="sm" variant="secondary" loading={pending} onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4" />
          Choisir un fichier
        </Button>
      </div>

      {fileName && !result && !error && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <FileText className="w-4 h-4 shrink-0" />
          {fileName}
          {pending && <span className="text-xs text-brand">Import en cours…</span>}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-success-light border border-success text-sm text-success">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{result.imported}</strong> annonce{result.imported !== 1 ? "s" : ""} importée{result.imported !== 1 ? "s" : ""} avec succès.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error-light border border-error text-sm text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <a
        href="#csv-format"
        className="text-xs text-brand hover:underline"
        onClick={(e) => {
          e.preventDefault();
          alert(
            "Format CSV attendu (en-têtes en snake_case) :\n\n" +
            "Obligatoires : title, description, price_xaf, condition (NEW/LIKE_NEW/GOOD/FAIR/POOR), city\n" +
            "Optionnels : negotiable (true ou 1), type (SERVICE, sinon SALE par défaut), category_id, subcategory_id, neighborhood\n\n" +
            "Exemple :\n" +
            "title,description,price_xaf,condition,city\n" +
            "Montre Casio,Belle montre peu utilisée,15000,GOOD,N'Djamena"
          );
        }}
      >
        Voir le format CSV attendu
      </a>

      <input ref={inputRef} type="file" accept=".csv" className="sr-only" onChange={handleChange} />
    </div>
  );
}
