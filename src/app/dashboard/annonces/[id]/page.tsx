"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Package, Eye, Trash2, RefreshCw, Upload, AlertCircle, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { CHAD_CITIES, ANNONCE_CONDITIONS, CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "@/lib/constants";
import {
  updateAnnonce, publishAnnonce, renewAnnonce,
  deleteOwnAnnonce, uploadAnnonceImages,
} from "../../actions";
import type { Category } from "@/types/api";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", DRAFT: "Brouillon", SOLD: "Vendue", EXPIRED: "Expirée", DELETED: "Supprimée",
};
const STATUS_VARIANTS: Record<string, "success" | "warning" | "neutral" | "error"> = {
  ACTIVE: "success", DRAFT: "warning", SOLD: "neutral", EXPIRED: "error", DELETED: "error",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

/**
 * `GET /annonces/:id` real shape (confirmed 2026-07-24): `priceXAF`, not
 * `price`; no `images` array — only `imagesCount` + a single `primaryImageUrl`
 * (no endpoint exists to list every uploaded image back, cf. HANDOFF_INFRA.md).
 */
interface AnnonceData {
  id: string; title: string; description: string; priceXAF: number;
  type: "SALE" | "SERVICE"; condition: string; city: string;
  categoryId: string; status: string; imagesCount: number; primaryImageUrl?: string;
}

export default function AnnonceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [annonce, setAnnonce] = useState<AnnonceData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annonceId, setAnnonceId] = useState<string>("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"SALE" | "SERVICE">("SALE");

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then((body) => setCategories(body.data ?? []))
      .catch(() => { /* fallback to empty list, select will just show the current category id */ });

    params.then(({ id }) => {
      setAnnonceId(id);
      fetch(`${API_BASE}/annonces/${id}`, { credentials: "include" })
        .then((r) => r.json())
        .then((body) => {
          const a: AnnonceData = body.data ?? body;
          setAnnonce(a);
          setTitle(a.title);
          setDescription(a.description);
          setPrice(String(a.priceXAF));
          setCondition(a.condition);
          setCity(a.city);
          setCategoryId(a.categoryId);
          setType(a.type);
        })
        .catch(() => setError("Impossible de charger l'annonce."))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const fieldCls = "w-full h-10 px-3 rounded-xl border border-border bg-white text-sm text-text-primary focus:outline-none focus:border-brand transition-colors";

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      try {
        await updateAnnonce(annonceId, {
          title, description, price: Number(price), condition, city, categoryId,
        });
        setSaved(true);
        setAnnonce((a) => a ? { ...a, title, description, priceXAF: Number(price), condition, city, categoryId } : a);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));
    startTransition(async () => {
      try {
        await uploadAnnonceImages(annonceId, formData);
        // Refresh annonce (no endpoint returns the full image list — just the primary + count)
        const r = await fetch(`${API_BASE}/annonces/${annonceId}`, { credentials: "include" });
        const body = await r.json();
        const updated: AnnonceData | undefined = body.data ?? body;
        setAnnonce((a) => a ? {
          ...a,
          imagesCount: updated?.imagesCount ?? a.imagesCount,
          primaryImageUrl: updated?.primaryImageUrl ?? a.primaryImageUrl,
        } : a);
      } catch { /* silently fail */ }
    });
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!annonce || error) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-text-secondary">{error ?? "Annonce introuvable"}</p>
        <Link href="/dashboard/annonces" className="text-brand hover:underline text-sm">Retour</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/annonces"
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-disabled">Édition d'annonce</p>
          <h2 className="font-bold text-text-primary truncate">{annonce.title}</h2>
        </div>
        <Badge variant={STATUS_VARIANTS[annonce.status] ?? "neutral"}>
          {STATUS_LABELS[annonce.status] ?? annonce.status}
        </Badge>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <a href={`/annonces/${annonce.id}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary">
            <Eye className="w-4 h-4" /> Voir
          </Button>
        </a>
        {annonce.status === "DRAFT" && (
          <Button size="sm" variant="primary" loading={pending}
            onClick={() => startTransition(async () => {
              await publishAnnonce(annonce.id);
              setAnnonce((a) => a ? { ...a, status: "ACTIVE" } : a);
            })}>
            Publier maintenant
          </Button>
        )}
        {annonce.status === "EXPIRED" && (
          <Button size="sm" variant="secondary" loading={pending}
            onClick={() => startTransition(async () => {
              await renewAnnonce(annonce.id);
              setAnnonce((a) => a ? { ...a, status: "ACTIVE" } : a);
            })}>
            <RefreshCw className="w-4 h-4" /> Renouveler
          </Button>
        )}
        <Button size="sm" variant="secondary" loading={pending}
          className="text-error border-error hover:bg-error-light ml-auto"
          onClick={() => {
            if (confirm("Supprimer définitivement cette annonce ?")) {
              startTransition(async () => {
                await deleteOwnAnnonce(annonce.id);
                router.push("/dashboard/annonces");
              });
            }
          }}>
          <Trash2 className="w-4 h-4" /> Supprimer
        </Button>
      </div>

      {/* Images — the API only ever exposes the primary photo back (no
          endpoint lists every uploaded image), even though several can be
          uploaded; `imagesCount` still reflects the real total server-side. */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
        <p className="text-sm font-semibold text-text-primary">Photos ({annonce.imagesCount}/10)</p>
        <div className="flex gap-3 flex-wrap">
          {annonce.primaryImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={annonce.primaryImageUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
          )}
          {annonce.imagesCount < 10 && (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-brand flex items-center justify-center cursor-pointer transition-colors text-text-disabled hover:text-brand">
              <Upload className="w-6 h-6" />
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border p-5 space-y-5">
        <p className="text-sm font-semibold text-text-primary">Informations</p>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-error-light border border-error">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Titre *</label>
          <Input value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Prix (XAF) *</label>
            <Input type="number" value={price} onChange={(e) => { setPrice(e.target.value); setSaved(false); }} min={0} required />
          </div>
          {type === "SALE" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">État</label>
              <select value={condition} onChange={(e) => { setCondition(e.target.value); setSaved(false); }} className={fieldCls}>
                {Object.entries(ANNONCE_CONDITIONS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Catégorie</label>
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSaved(false); }} className={fieldCls}>
              {categories.map((c) => {
                const style = CATEGORY_STYLE[c.slug] ?? DEFAULT_CATEGORY_STYLE;
                return (<option key={c.id} value={c.id}>{c.icon ?? style.icon} {c.name}</option>);
              })}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Ville</label>
            <select value={city} onChange={(e) => { setCity(e.target.value); setSaved(false); }} className={fieldCls}>
              {CHAD_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Description *</label>
          <textarea value={description} onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
            rows={5} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-text-primary focus:outline-none focus:border-brand transition-colors resize-none" required />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={pending} variant="primary">Enregistrer</Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success font-medium">
              <CheckCircle className="w-4 h-4" /> Modifications enregistrées
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
