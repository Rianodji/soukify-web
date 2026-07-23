import { getCategories } from "@/lib/categories";
import { NewAnnonceForm } from "./NewAnnonceForm";

export default async function NewAnnoncePage() {
  const categories = await getCategories();
  return <NewAnnonceForm categories={categories} />;
}
