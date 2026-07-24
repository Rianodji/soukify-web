"use client";

import { useState, useTransition } from "react";
import { UserPlus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { addStaffMember, removeStaffMember, changeStaffRole } from "../actions";
import type { ShopMember, StaffRole } from "@/types/api";

const ROLE_CONFIG: Record<StaffRole, { label: string; variant: "gold" | "default" | "neutral" }> = {
  OWNER:   { label: "Propriétaire", variant: "gold" },
  MANAGER: { label: "Manager",      variant: "default" },
  STAFF:   { label: "Staff",        variant: "neutral" },
};

interface ShopEquipeProps {
  shopId: string;
  members: ShopMember[];
  /** `ShopMember` only carries `userId` — resolved display names, keyed by userId. */
  memberNames: Record<string, string>;
}

export function ShopEquipe({ shopId, members, memberNames }: ShopEquipeProps) {
  const [pending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addStaffMember(shopId, phone.trim());
        setPhone("");
        setShowAdd(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Impossible d'ajouter ce membre.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">Équipe</h3>
          <p className="text-xs text-text-secondary mt-0.5">{members.length} membre{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd((v) => !v)}>
          <UserPlus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-primary-50 rounded-xl border border-primary-100 p-4 space-y-3">
          <p className="text-sm font-medium text-text-primary">Ajouter un membre par numéro</p>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+235 XX XX XX XX"
              className="flex-1"
            />
            <Button type="submit" size="sm" loading={pending}>Ajouter</Button>
          </div>
        </form>
      )}

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
        {members.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <Shield className="w-8 h-8 text-border" />
            <p className="text-sm text-text-secondary">Aucun membre pour le moment.</p>
          </div>
        ) : (
          members.map((member) => {
            const roleConf = ROLE_CONFIG[member.role];
            const label = memberNames[member.userId] ?? `Utilisateur #${member.userId.slice(0, 8)}`;
            return (
              <div key={member.userId} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {label[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{label}</p>
                </div>
                <Badge variant={roleConf.variant}>{roleConf.label}</Badge>

                {member.role !== "OWNER" && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={member.role}
                      onChange={(e) => {
                        startTransition(() =>
                          changeStaffRole(shopId, member.userId, e.target.value as "MANAGER" | "STAFF")
                        );
                      }}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-text-secondary focus:outline-none focus:border-brand"
                    >
                      <option value="MANAGER">Manager</option>
                      <option value="STAFF">Staff</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => startTransition(() => removeStaffMember(shopId, member.userId))}
                      className="w-7 h-7 rounded-lg text-error hover:bg-error-light flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
