import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface Message {
  type: "succes" | "erreur";
  texte: string;
}

/** Retour d'une action (succès en vert, erreur en rose de la charte). */
function Alerte({
  message,
  onClose,
}: {
  message: Message;
  onClose?: () => void;
}) {
  const succes = message.type === "succes";
  const Icon = succes ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={succes ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
        succes
          ? "bg-brand-green/10 text-brand-green"
          : "bg-brand-pink/10 text-brand-pink"
      }`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
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
