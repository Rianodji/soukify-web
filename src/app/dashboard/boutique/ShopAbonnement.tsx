"use client";

import { useTransition } from "react";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { changeSubscription } from "../actions";
import type { ShopSubscription } from "@/types/api";

const PLANS: Array<{
  id: ShopSubscription;
  name: string;
  price: string;
  annonces: number;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: "FREE",
    name: "Gratuit",
    price: "0 XAF/mois",
    annonces: 10,
    features: ["10 annonces", "Stats basiques", "Messagerie"],
  },
  {
    id: "STANDARD",
    name: "Standard",
    price: "10 000 XAF/mois",
    annonces: 100,
    features: ["100 annonces", "Import CSV", "Stats avancées", "Support prioritaire"],
    highlight: true,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "25 000 XAF/mois",
    annonces: 1000,
    features: ["1000 annonces", "Import CSV illimité", "Stats temps réel", "Account manager dédié"],
  },
];

interface ShopAbonnementProps {
  shopId: string;
  currentPlan: ShopSubscription;
}

export function ShopAbonnement({ shopId, currentPlan }: ShopAbonnementProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-text-primary">Abonnement</h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Plan actuel : <span className="font-semibold text-brand">{PLANS.find((p) => p.id === currentPlan)?.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 space-y-4 ${
                plan.highlight && !isCurrent
                  ? "border-brand"
                  : isCurrent
                  ? "border-success bg-success-light/30"
                  : "border-border"
              }`}
            >
              {plan.highlight && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Recommandé
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-white text-xs font-bold px-3 py-1 rounded-full">
                  Plan actuel
                </div>
              )}

              <div>
                <p className="font-bold text-text-primary">{plan.name}</p>
                <p className="text-sm text-gold font-semibold mt-0.5">{plan.price}</p>
              </div>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                variant={isCurrent ? "ghost" : plan.highlight ? "primary" : "secondary"}
                className="w-full"
                disabled={isCurrent || pending}
                loading={pending && !isCurrent}
                onClick={() => startTransition(() => changeSubscription(shopId, plan.id))}
              >
                {isCurrent ? "Plan actuel" : "Choisir ce plan"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
