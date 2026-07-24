"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createTicket } from "../actions";

const TYPES = [
  { value: "SUPPORT",  label: "Support" },
  { value: "DISPUTE",  label: "Litige" },
];

export function NewTicketButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", description: "", type: "SUPPORT" as "SUPPORT" | "DISPUTE", orderId: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createTicket({
          subject:     form.subject.trim(),
          description: form.description.trim(),
          type:        form.type,
          orderId:     form.orderId.trim() || undefined,
        });
        setOpen(false);
        setForm({ subject: "", description: "", type: "SUPPORT", orderId: "" });
        router.push(`/admin/tickets/${id}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  const fieldCls = "w-full h-10 px-3 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand transition-colors";

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Créer un ticket
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-text-primary">Nouveau ticket</h2>
                <button type="button" onClick={() => setOpen(false)} className="text-text-disabled hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-error-light border border-error">
                    <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Sujet *</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Ex : Problème de paiement commande #xxx"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    placeholder="Décrivez le problème en détail…"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand resize-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "SUPPORT" | "DISPUTE" }))}
                      className={fieldCls}
                    >
                      {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">ID commande</label>
                    <input
                      value={form.orderId}
                      onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                      placeholder="Optionnel"
                      className={fieldCls}
                    />
                  </div>
                </div>
                <p className="text-xs text-text-disabled -mt-2">
                  Le ticket sera créé en votre nom (l&apos;API ne permet pas de le rattacher à un autre utilisateur).
                </p>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" size="md" className="flex-1" loading={pending}>
                    Créer le ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
