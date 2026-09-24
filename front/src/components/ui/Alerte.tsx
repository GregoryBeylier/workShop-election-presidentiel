import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface Message {
  type: "succes" | "erreur";
  texte: string;
}

// Sur fond clair : teinte légère ; sur le bandeau en dégradé (`surFondSombre`),
// le vert translucide ne se lit plus : carte blanche, seule l'icône porte la couleur
const styles = {
  clair: {
    succes: { boite: "bg-brand-green/10 text-brand-green", icone: "" },
    erreur: { boite: "bg-brand-pink/10 text-brand-pink", icone: "" },
  },
  sombre: {
    succes: {
      boite: "bg-white text-brand-dark shadow-lg",
      icone: "text-brand-teal-dark",
    },
    erreur: {
      boite: "bg-white text-brand-dark shadow-lg",
      icone: "text-brand-pink",
    },
  },
};

/** Retour d'une action (succès en vert, erreur en rose de la charte). */
function Alerte({
  message,
  onClose,
  surFondSombre = false,
}: {
  message: Message;
  onClose?: () => void;
  surFondSombre?: boolean;
}) {
  const succes = message.type === "succes";
  const Icon = succes ? CheckCircle2 : AlertCircle;
  const style = styles[surFondSombre ? "sombre" : "clair"][message.type];
  return (
    <div
      role={succes ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${style.boite}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${style.icone}`} />
      <p className="flex-1 font-medium">{message.texte}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default Alerte;
