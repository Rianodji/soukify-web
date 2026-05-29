import { SoukifyLogo } from "@/components/ui/SoukifyLogo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand (hidden on mobile) ── */}
      <aside className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col relative overflow-hidden bg-brand">
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0d9488 0%, #0f766e 40%, #115e59 100%)",
          }}
        />

        {/* Subtle geometric pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-white/5 translate-x-1/2" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <path d="M13 16.5C13 14 15 12 18.5 12C21.5 12 23.5 13.5 24 15.5H21C20.7 14.8 19.8 14 18.5 14C17 14 15.5 14.8 15.5 16.5C15.5 18 16.8 18.8 19 19.5C22 20.5 27 21.5 27 25.5C27 28.5 24.5 30 21 30C17.5 30 15 28 14.5 25.5H17.5C17.8 27 19.2 28 21 28C23 28 24.5 27 24.5 25.5C24.5 23.5 22.8 23 20 22C17 21 13 19.5 13 16.5Z" fill="white" />
                  <circle cx="31" cy="11" r="5" fill="#f59e0b" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Soukify</span>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center mt-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse-soft" />
                La marketplace du Tchad
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Achetez et vendez{" "}
                <span className="text-accent-300">en toute confiance</span>
              </h1>

              <p className="text-white/75 text-lg leading-relaxed max-w-sm">
                Des milliers d&apos;annonces à N&apos;Djamena et partout au Tchad.
                Paiement sécurisé par Mobile Money.
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              {[
                { icon: "🔐", label: "Paiement sécurisé", sub: "Escrow protégé" },
                { icon: "📱", label: "Mobile Money", sub: "Airtel & Moov" },
                { icon: "✅", label: "Vendeurs vérifiés", sub: "KYC requis" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center"
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-white text-xs font-semibold">{item.label}</div>
                  <div className="text-white/60 text-xs mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/40 text-xs">
            © 2026 Soukify. Tous droits réservés.
          </div>
        </div>
      </aside>

      {/* ── Right panel — form ── */}
      <main className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-border bg-white">
          <SoukifyLogo size="sm" />
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-brand transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-fade-in">
            {children}
          </div>
        </div>

        <footer className="text-center p-5 text-xs text-text-disabled">
          <p>
            En continuant, vous acceptez nos{" "}
            <Link href="/legal/cgu" className="text-brand hover:underline">
              Conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/legal/privacy" className="text-brand hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
