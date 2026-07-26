"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X, ZoomIn } from "lucide-react";

interface KycDocumentViewerProps {
  src: string;
  alt: string;
}

type State =
  | { status: "loading" }
  | { status: "ok"; url: string; contentType: string }
  | { status: "error"; message: string };

/**
 * The API accepts JPEG/PNG/PDF for a KYC document (magic-byte-validated
 * server-side, cf. HANDOFF_INFRA.md, 2026-07-26) — this renders whichever
 * one comes back, based on the real `Content-Type`, not a guess. `<img
 * src>` can't attach a Bearer token or distinguish 401/403/404 from a
 * generic failure, so this fetches the proxy route directly.
 */
export function KycDocumentViewer({ src, alt }: KycDocumentViewerProps) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [decodeFailed, setDecodeFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomed]);

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
        const contentType = res.headers.get("Content-Type") ?? "";
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ status: "ok", url: objectUrl, contentType });
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
    return <p className="text-xs text-text-disabled italic">Le fichier reçu n&apos;est pas un document valide.</p>;
  }

  if (state.contentType === "application/pdf") {
    return (
      <div className="space-y-1.5">
        {/* Modern browsers render PDFs natively inline in an iframe — no extra click, no library. */}
        <iframe src={state.url} title={alt} className="w-full h-96 rounded-xl border border-border" />
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-brand hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ouvrir dans un nouvel onglet
        </a>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="group relative w-full rounded-xl border border-border overflow-hidden cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.url}
          alt={alt}
          className="w-full object-contain max-h-64"
          /* The proxy can return 200 with bytes the browser can't decode as
           * an image (e.g. a stored file that isn't actually a photo) —
           * `fetch` alone can't catch this, only the `<img>` decode step can. */
          onError={() => setDecodeFailed(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.url}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
