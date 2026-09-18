import { useData } from "@/contexts/DataContext";

export function SystemStatus() {
  const { healthOk } = useData();

  const ok = healthOk === true;
  const checking = healthOk === null;

  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
      aria-label={ok ? "Système opérationnel" : "Connexion au serveur indisponible"}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${
          checking
            ? "animate-pulse bg-ink-faint"
            : ok
              ? "bg-ok"
              : "bg-red"
        }`}
      />
      {checking
        ? "Vérification..."
        : ok
          ? "Système opérationnel"
          : "Connexion au serveur indisponible"}
    </span>
  );
}