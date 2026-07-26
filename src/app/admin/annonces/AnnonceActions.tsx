"use client";

import { useState, useTransition } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { deleteAnnonce } from "../actions";

interface AnnonceActionsProps {
  annonceId: string;
}

export function AnnonceActions({ annonceId }: AnnonceActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <a
          href={`/annonces/${annonceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors"
          title="Voir l'annonce"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Supprimer définitivement cette annonce ?")) {
              setError(null);
              startTransition(async () => {
                try {
                  await deleteAnnonce(annonceId);
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : "Impossible de supprimer l'annonce.");
                }
              });
            }
          }}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-error hover:bg-error-light hover:border-error transition-colors disabled:opacity-50"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-error mt-1 max-w-[160px]">{error}</p>}
    </div>
  );
}
