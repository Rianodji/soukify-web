import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/layout/MarketplaceFooter";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketplaceHeader />
      <main className="flex-1">{children}</main>
      <MarketplaceFooter />
    </div>
  );
}
