"use client";

import { useEffect, useState } from "react";

interface AuthenticatedDocumentImageProps {
  src: string;
  alt: string;
}

/**
 * `<img src>` can't distinguish 401/403/404 from a generic failure — it
 * just fires `onError` with no status. Fetches the proxy route directly so
 * we can show a specific, honest message instead of always saying
 * "unavailable" (cf. HANDOFF_INFRA.md, 2026-07-26).
 */
export function AuthenticatedDocumentImage({ src, alt }: AuthenticatedDocumentImageProps) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "ok"; url: string } | { status: "error"; message: string }
  >({ status: "loading" });
  const [decodeFailed, setDecodeFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404) {
          setState({ status: "error", message: "Aucun document trouvé." });
          return;
        }
        if (res.status === 403) {
          setState({ status: "error", message: "Vous n'avez pas les droits pour voir ce document." });
          return;
        }
        if (res.status === 401) {
          setState({ status: "error", message: "Session expirée — reconnectez-vous." });
          return;
        }
        if (!res.ok) {
          setState({ status: "error", message: `Document indisponible (erreur ${res.status}).` });
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ status: "ok", url: objectUrl });
      } catch {
        if (!cancelled) setState({ status: "error", message: "Document indisponible (erreur réseau)." });
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (state.status === "loading") {
    return <div className="w-full h-32 rounded-xl bg-border animate-pulse" />;
  }

  if (state.status === "error") {
    return <p className="text-xs text-text-disabled italic">{state.message}</p>;
  }

  if (decodeFailed) {
    return <p className="text-xs text-text-disabled italic">Le fichier reçu n&apos;est pas une image valide.</p>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={state.url}
      alt={alt}
      className="w-full rounded-xl border border-border object-contain max-h-64"
      /* The proxy can return 200 with bytes the browser can't decode as an
       * image (e.g. a stored file that isn't actually a photo) — `fetch`
       * alone can't catch this, only the `<img>` decode step can. */
      onError={() => setDecodeFailed(true)}
    />
  );
}
