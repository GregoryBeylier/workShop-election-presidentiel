import { ChevronLeft, ChevronRight } from "lucide-react";

// Pages affichées : la première, la dernière et les voisines de la page courante,
// "…" pour les trous (ex : 1 … 4 5 6 … 12)
function pagesVisibles(page: number, total: number): (number | "…")[] {
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return pages;
}

const styleBouton =
  "flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-medium transition-colors duration-300";

/** Pagination en pilules : "16–19 sur 19" + précédent / numéros / suivant. */
function Pagination({
  page,
  parPage,
  total,
  onChange,
}: {
  page: number; // commence à 1
  parPage: number;
  total: number; // nombre d'éléments
  onChange: (page: number) => void;
}) {
  const nbPages = Math.ceil(total / parPage);
  if (nbPages <= 1) return null;

  const debut = (page - 1) * parPage + 1;
  const fin = Math.min(page * parPage, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-xs text-gray-500">
        <span className="font-semibold text-brand-dark">
          {debut}–{fin}
        </span>{" "}
        sur {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Page précédente"
          className={`${styleBouton} text-gray-500 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronLeft size={16} />
        </button>
        {pagesVisibles(page, nbPages).map((p, i) =>
          p === "…" ? (
            <span key={`trou-${i}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${styleBouton} ${
                p === page
                  ? "bg-brand-teal text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-brand-dark"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === nbPages}
          aria-label="Page suivante"
          className={`${styleBouton} text-gray-500 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
