interface PkSignProps {
  axe?: string;
  pk: string;
  className?: string;
}

/**
 * Panneau kilométrique — l'élément signature du thème signalétique.
 * Un panonceau jaune porte l'axe, un panneau bleu signal porte le PK,
 * comme les bornes kilométriques des autoroutes marocaines.
 */
export function PkSign({ axe, pk, className = "" }: PkSignProps) {
  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      {axe && (
        <span className="inline-flex min-w-16 items-center justify-center rounded-t bg-marker px-2 pt-0.5 pb-0 text-adm-950">
          <span className="font-display text-sm leading-none">{axe}</span>
        </span>
      )}
      <div className="inline-flex items-center gap-2 rounded-md rounded-tl-none bg-adm-600 px-4 py-2 text-white ring-1 ring-adm-950/25">
        <span aria-hidden="true" className="font-display text-xs leading-none text-marker">
          PK
        </span>
        <span className="font-display text-xl leading-none tracking-normal tabular-nums">
          {pk}
        </span>
      </div>
    </div>
  );
}