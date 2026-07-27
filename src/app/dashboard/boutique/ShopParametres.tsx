"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle } from "lucide-react";
import { updateShop } from "../actions";

interface ShopParametresProps {
  shopId: string;
  name: string;
  description?: string;
}

export function ShopParametres({ shopId, name: initialName, description: initialDesc }: ShopParametresProps) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDesc ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateShop(shopId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (result.ok) setSaved(true);
      else setError(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary">Paramètres de la boutique</h3>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-error-light border border-error">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nom de la boutique *</label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            required
            minLength={3}
            maxLength={60}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Description</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 resize-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={pending}>Enregistrer</Button>
          {saved && <p className="text-sm text-success font-medium">✓ Modifications enregistrées</p>}
        </div>
      </form>
    </div>
  );
}
