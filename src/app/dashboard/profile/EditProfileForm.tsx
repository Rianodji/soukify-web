"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle } from "lucide-react";
import { updateUserProfile } from "../actions";

interface EditProfileFormProps {
  currentName: string;
}

export function EditProfileForm({ currentName }: EditProfileFormProps) {
  const [name, setName] = useState(currentName);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;
    setError(null); setSaved(false);
    startTransition(async () => {
      try {
        await updateUserProfile({ name: name.trim() });
        setSaved(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Impossible de modifier le profil.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Nom complet</label>
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          placeholder="Votre nom"
          required
          minLength={2}
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={pending}
          disabled={!name.trim() || name.trim() === currentName}>
          Enregistrer le nom
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success font-medium">
            <CheckCircle className="w-4 h-4" /> Nom mis à jour
          </span>
        )}
      </div>
    </form>
  );
}
