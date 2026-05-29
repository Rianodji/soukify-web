import Link from "next/link";
import { SoukifyLogo } from "@/components/ui/SoukifyLogo";

const links = {
  Marketplace: [
    { href: "/search", label: "Parcourir les annonces" },
    { href: "/annonces/new", label: "Publier une annonce" },
    { href: "/search?type=SERVICE", label: "Services" },
  ],
  Vendeurs: [
    { href: "/register", label: "Créer un compte" },
    { href: "/pro", label: "Espace Pro" },
    { href: "/dashboard/wallet", label: "Mon portefeuille" },
  ],
  Support: [
    { href: "/help", label: "Centre d'aide" },
    { href: "/contact", label: "Nous contacter" },
    { href: "/legal/cgu", label: "Conditions d'utilisation" },
    { href: "/legal/privacy", label: "Politique de confidentialité" },
  ],
};

export function MarketplaceFooter() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold">
                S
              </div>
              <span className="text-xl font-bold">Soukify</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              La marketplace de référence au Tchad. Achetez et vendez en toute sécurité avec Mobile Money.
            </p>
            {/* Mobile Money logos */}
            <div className="flex items-center gap-2 flex-wrap">
              {["Airtel Money", "Moov Chad"].map((m) => (
                <span
                  key={m}
                  className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/80"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section} className="space-y-4">
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2026 Soukify. Tous droits réservés. N&apos;Djamena, Tchad.</p>
          <p>Fait avec ❤️ pour le Tchad</p>
        </div>
      </div>
    </footer>
  );
}
