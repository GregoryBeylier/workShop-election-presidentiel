import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

/** Avertissement en tête des pages de confirmation du mode de vote (choix définitif). */
function AvertissementChoix({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-brand-pink bg-brand-pink/10 px-4 py-3 text-brand-dark"
    >
      <TriangleAlert size={20} className="mt-0.5 shrink-0 text-brand-pink" />
      <p>{children}</p>
    </div>
  );
}

export default AvertissementChoix;
