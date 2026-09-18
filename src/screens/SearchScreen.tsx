import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { ErrorState } from "@/components/base/ErrorState";
import { Field } from "@/components/base/Field";
import { LoadingState } from "@/components/base/LoadingState";
import { MessageText } from "@/components/base/MessageText";
import { PkSign } from "@/components/base/PkSign";
import { ColorSelector } from "@/components/search/ColorSelector";
import { DetectionSelector } from "@/components/search/DetectionSelector";
import { DirectionSelector } from "@/components/search/DirectionSelector";
import { EventTypeSelector } from "@/components/search/EventTypeSelector";
import { HighwaySelector } from "@/components/search/HighwaySelector";
import { PkInput } from "@/components/search/PkInput";
import { StatusSelector } from "@/components/search/StatusSelector";
import { useData } from "@/contexts/DataContext";
import { useEvent } from "@/contexts/EventContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/services/api";
import { interpolateCoords, googleMapsUrl } from "@/services/geo";
import {
  findNearestLocation,
  formatPk,
  formatPkKm,
  locationLabel,
  parsePk,
  randomPk,
  type LocationResult,
} from "@/services/location";
import { buildAdmMessage } from "@/services/message";
import { copyText, waShareUrl } from "@/services/share";
import type {
  EventColorDef,
  RequestTypeDef,
  ScreenId,
  StatusDef,
} from "@/types";

interface SearchScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

/* Axes affichés dans la recherche PK. */
const SEARCH_HIGHWAY_IDS = ["A1", "A2", "A3", "A4", "A5", "A7", "A31", "A101"];

export function SearchScreen({ onNavigate }: SearchScreenProps) {
  const { highways, catalogs, loadingCatalogs, errorCatalogs, refreshHistory } =
    useData();
  const { fillFromSearch } = useEvent();
  const { notify } = useToast();

  const pkInputRef = useRef<HTMLInputElement>(null);

  const [highwayId, setHighwayId] = useState("");
  const [direction, setDirection] = useState("");
  const [pkText, setPkText] = useState("");

  const [searchedPk, setSearchedPk] = useState<number | null>(null);
  const [locResult, setLocResult] = useState<LocationResult | null>(null);

  const [color, setColor] = useState<EventColorDef | null>(null);
  const [type, setType] = useState<RequestTypeDef | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusDef | null>(null);

  const [savedRef, setSavedRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const highway = highways.find((h) => h.id === highwayId) ?? null;

  useEffect(() => {
    if (highways.length > 0 && !highwayId) {
      setHighwayId(highways[0].id);
      setDirection(highways[0].dirA);
    }
  }, [highways, highwayId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        pkInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parsedPk = highway ? parsePk(pkText, highway) : null;

  function computeSearch(pk: number, dir: string) {
    if (!highway) return;
    const result = findNearestLocation(highway, pk, dir);
    if (!result) return;
    setSearchedPk(pk);
    setLocResult(result);
    setSavedRef(null);
  }

  function handleSearch() {
    if (!highway) return;
    const pk = parsePk(pkText, highway);
    if (pk === null) {
      notify("PK invalide pour l'axe sélectionné.", "error");
      return;
    }
    computeSearch(pk, direction);
  }

  function handleRandom() {
    if (!highway) return;
    const pk = randomPk(highway);
    if (pk === null) return;
    setPkText(formatPk(pk));
    computeSearch(pk, direction);
  }

  function handleHighwayChange(id: string) {
    const next = highways.find((h) => h.id === id);
    setHighwayId(id);
    if (next) setDirection(next.dirA);
    setSearchedPk(null);
    setLocResult(null);
    setSavedRef(null);
  }

  function handleDirectionChange(dir: string) {
    setDirection(dir);
    if (searchedPk !== null) computeSearch(searchedPk, dir);
  }

  const locationLabelText =
    highway && searchedPk !== null
      ? locationLabel(highway, searchedPk, direction)
      : null;

  const admMessage = useMemo(() => {
    if (
      !highway ||
      searchedPk === null ||
      !locResult ||
      !color ||
      !type ||
      !status ||
      !catalogs
    ) {
      return null;
    }
    const sources = sourceId
      ? catalogs.detectionSources.data
          .filter((s) => s.id === sourceId)
          .map((s) => s.label)
      : [];
    return buildAdmMessage({
      colorEmoji: color.emoji,
      typeLabel: type.label,
      highwayId: highway.id,
      pk: searchedPk,
      location: locationLabelText ?? "",
      destination: locResult.destination,
      sources,
      statusLabel: status.label,
      bilan: null,
    });
  }, [
    highway,
    searchedPk,
    locResult,
    color,
    type,
    status,
    sourceId,
    catalogs,
    locationLabelText,
  ]);

  const gpsPoint =
    highway && searchedPk !== null
      ? interpolateCoords(highway.coords, searchedPk)
      : null;

  async function persist(): Promise<string | null> {
    if (
      !highway ||
      searchedPk === null ||
      !admMessage ||
      !color ||
      !type ||
      !status
    ) {
      return null;
    }
    setSaving(true);
    try {
      const created = await api.createHistory({
        highway: highway.id,
        pk: searchedPk,
        direction,
        color: color.id,
        typeId: type.id,
sourceIds: sourceId ? [sourceId] : [],
        statusId: status.id,
        message: admMessage,
      });
      await refreshHistory();
      setSavedRef(created.refCode);
      return created.refCode;
    } catch {
      notify("Enregistrement impossible.", "error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const ref = await persist();
    if (ref !== null) notify(`Événement ${ref} enregistré.`, "ok");
  }

  async function handleBilan() {
    if (
      !highway ||
      searchedPk === null ||
      !admMessage ||
      !color ||
      !type ||
      !status
    ) {
      return;
    }
    const ref = savedRef ?? (await persist());
    if (ref === null) return;
    fillFromSearch({
      highway,
      pk: searchedPk,
      direction,
      color: color.id,
      type,
      sourceIds: sourceId ? [sourceId] : [],
      status,
      message: admMessage,
      refCode: ref,
    });
    onNavigate("bilan");
  }

  const messageReady = color !== null && type !== null && status !== null;

  return (
    <section aria-label="Recherche" className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <p className="font-display text-3xl text-ink">
          Point de situation
        </p>
        <p className="mt-1 text-base text-ink-soft">
          Repérez et confirmez un événement sur le réseau autoroutier.
        </p>
      </div>

      <Card className="mb-4">
        <h2 className="text-base font-bold text-ink">Recherche PK</h2>
        <p className="mt-0.5 mb-4 text-sm text-ink-soft">
          Localisez un événement sur le réseau autoroutier.
        </p>

        <div className="grid gap-4">
          <Field label="Axes" htmlFor="highway-select">
            <HighwaySelector
              value={highwayId}
              onChange={handleHighwayChange}
              allowedIds={SEARCH_HIGHWAY_IDS}
            />
          </Field>

          <Field label="PK" htmlFor="pk-input">
            <PkInput
              value={pkText}
              onChange={setPkText}
              validPk={parsedPk}
              onEnter={handleSearch}
              inputRef={pkInputRef}
            />
          </Field>

          <Field label="Sens">
            {highway && (
              <DirectionSelector
                dirA={highway.dirA}
                dirB={highway.dirB}
                value={direction}
                onChange={handleDirectionChange}
              />
            )}
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={handleRandom} className="flex-1">
              <svg
                aria-hidden="true"
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 3h5v5" />
                <path d="M4 20 21 3" />
                <path d="M21 16v5h-5" />
                <path d="m15 15 6 6" />
                <path d="M4 4l5 5" />
              </svg>
              PK aléatoire
            </Button>
            <Button onClick={handleSearch} className="flex-1">
              <svg
                aria-hidden="true"
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Rechercher
            </Button>
          </div>

          <p className="text-xs tracking-wide text-ink-faint">
            Entrée pour rechercher · Ctrl K pour le champ PK
          </p>
        </div>
      </Card>

      {searchedPk !== null &&
        highway &&
        locResult &&
        locationLabelText !== null && (
          <>
            <Card className="mb-4">
              <h3 className="mb-4 text-base font-bold text-adm-700">
                Localisation
              </h3>
              <PkSign
                axe={highway.id}
                pk={formatPk(searchedPk)}
                className="mb-3"
              />
              <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color?.hex ?? "#7c8ea3" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base leading-snug font-bold text-ink">
                      📍 {highway.id} · PK {formatPkKm(searchedPk)} ·{" "}
                      {locationLabelText} ➡️ {locResult.destination}
                    </p>
                    <div className="mt-2">
                      {gpsPoint ? (
                        <a
                          href={googleMapsUrl(gpsPoint.lat, gpsPoint.lon)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-adm-50 px-4 py-2.5 text-base font-semibold text-adm-700 transition-colors hover:bg-adm-100"
                        >
                          <svg
                            aria-hidden="true"
                            className="size-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                          Ouvrir Google Maps
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <p className="text-sm text-ink-faint">
                          Localisation GPS indisponible pour cet axe.
                        </p>
                      )}
                    </div>
                    {gpsPoint && (
                      <div className="mt-3 w-full max-w-full overflow-hidden rounded-xl border border-line">
                        <iframe
                          title={`Localisation ${highway.id} PK ${formatPkKm(searchedPk)}`}
                          src={`https://maps.google.com/maps?q=${gpsPoint.lat},${gpsPoint.lon}&z=16&output=embed`}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="block h-64 w-full max-w-full border-0"
                        />
                      </div>
                    )}
                  </div>
                </div>
            </Card>

            <Card className="mb-4">
              <h3 className="mb-4 text-base font-bold text-adm-700">
                Informations événement
              </h3>
              {!catalogs &&
                (loadingCatalogs ? (
                  <LoadingState label="Chargement des référentiels..." />
                ) : (
                  <ErrorState message={errorCatalogs ?? "Référentiels indisponibles."} />
                ))}
              {catalogs && (
<div className="grid gap-5">
                  <Field label="Couleur">
                    <ColorSelector
                      colors={catalogs.eventColors.data}
                      value={color}
                      onChange={setColor}
                    />
                  </Field>
                  <Field label="Statut">
                    <StatusSelector
                      statuses={catalogs.statuses.data}
                      value={status}
                      onChange={setStatus}
                    />
                  </Field>
                  <Field label="Détection">
                    <DetectionSelector
                      sources={catalogs.detectionSources.data}
                      value={sourceId}
                      onChange={setSourceId}
                    />
                  </Field>
                  <Field label="Type d'événement" htmlFor="event-type-select">
                    <EventTypeSelector
                      types={catalogs.requestTypes.data}
                      value={type}
                      onChange={setType}
                    />
                  </Field>
                </div>
              )}
            </Card>

            <Card className="mb-4">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="mb-4 text-base font-bold text-adm-700">
                  Message ADM
                </h3>
                {savedRef && (
                  <span className="text-xs font-semibold text-ok">
                    Réf. {savedRef}
                  </span>
                )}
              </div>

              {admMessage ? (
                <MessageText text={admMessage} />
              ) : (
                <p className="text-sm text-ink-faint">
                  Sélectionnez la couleur, le type et le statut pour composer
                  le message ADM.
                </p>
              )}

              {admMessage && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void copyText(admMessage).then(() =>
                        notify("Message copié.", "ok"),
                      );
                    }}
                    className="flex-1"
                  >
                    Copier
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="flex-1"
                  >
                    Enregistrer
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      window.open(waShareUrl(admMessage), "_blank", "noopener")
                    }
                    className="flex-1"
                  >
                    WhatsApp
                  </Button>
                </div>
              )}
            </Card>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!messageReady || !admMessage || saving}
              onClick={() => void handleBilan()}
            >
              Établir le bilan
            </Button>
          </>
        )}
    </section>
  );
}