import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { ErrorState } from "@/components/base/ErrorState";
import { Field } from "@/components/base/Field";
import { LoadingState } from "@/components/base/LoadingState";
import { MessageText } from "@/components/base/MessageText";
import { PkSign } from "@/components/base/PkSign";
import { BilanOptionsFields } from "@/components/bilan/BilanOptionsFields";
import { EventStateSelector } from "@/components/event/EventStateSelector";
import { ColorSelector } from "@/components/search/ColorSelector";
import { DetectionSelector } from "@/components/search/DetectionSelector";
import { DirectionSelector } from "@/components/search/DirectionSelector";
import { EventTypeSelector } from "@/components/search/EventTypeSelector";
import { HighwaySelector } from "@/components/search/HighwaySelector";
import { PkInput } from "@/components/search/PkInput";
import { StatusSelector } from "@/components/search/StatusSelector";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { toBilanData, useBilanOptions } from "@/hooks/useBilanOptions";
import { api } from "@/services/api";
import {
  defaultStatusForState,
  statusesForState,
  type EventStateId,
} from "@/services/eventState";
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
import { buildAdmMessage, buildBilanMessage } from "@/services/message";
import { exportBilanPdf } from "@/services/pdf";
import { copyText, waShareUrl } from "@/services/share";
import type {
  EventColorDef,
  RequestTypeDef,
  StatusDef,
} from "@/types";

/* Axes affichés dans la recherche PK (page Recherche). */
const SEARCH_HIGHWAY_IDS = ["A1", "A2", "A3", "A4", "A5", "A7", "A31", "A101"];

/* Axes affichés dans le bilan : axes puis pénétrantes. */
const BILAN_HIGHWAY_IDS = [
  "A1",
  "A2",
  "A3",
  "A5",
  "A4",
  "A7",
  "A31",
  "A101",
  "A102",
  "A103",
  "A201",
  "A301",
  "A501",
];

function allowedHighwayIds(state: EventStateId): string[] {
  return state === "confirme" ? BILAN_HIGHWAY_IDS : SEARCH_HIGHWAY_IDS;
}

export function EventScreen() {
  const { highways, catalogs, loadingCatalogs, errorCatalogs, refreshHistory } =
    useData();
  const { notify } = useToast();

  const bilanOpts = useBilanOptions(catalogs);

  const pkInputRef = useRef<HTMLInputElement>(null);

  const [eventState, setEventState] = useState<EventStateId>("confirmer");
  const [stepIndex, setStepIndex] = useState(0);

  const [highwayId, setHighwayId] = useState("");
  const [direction, setDirection] = useState("");
  const [pkText, setPkText] = useState("");

  const [searchedPk, setSearchedPk] = useState<number | null>(null);
  const [locResult, setLocResult] = useState<LocationResult | null>(null);

  const [color, setColor] = useState<EventColorDef | null>(null);
  const [type, setType] = useState<RequestTypeDef | null>(null);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusDef | null>(null);

  const [savedRef, setSavedRef] = useState<string | null>(null);
  const [persistedMessage, setPersistedMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const highway = highways.find((h) => h.id === highwayId) ?? null;

  useEffect(() => {
    if (highways.length > 0 && !highwayId) {
      const first =
        highways.find((h) => allowedHighwayIds(eventState).includes(h.id)) ??
        highways[0];
      setHighwayId(first.id);
      setDirection(first.dirA);
    }
  }, [highways, highwayId, eventState]);

  useEffect(() => {
    if (!catalogs) return;
    const statuses = catalogs.statuses?.data ?? [];
    const allowed = statusesForState(eventState, statuses);
    if (status && allowed.some((s) => s.id === status.id)) return;
    const next = defaultStatusForState(eventState, statuses);
    if (next) setStatus(next);
  }, [catalogs, eventState, status]);

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

  const eventReady =
    highway !== null && searchedPk !== null && direction !== "";

  const locationText = eventReady
    ? locationLabel(highway, searchedPk, direction)
    : null;

  const destText = locResult?.destination ?? "";

  const gpsPoint =
    highway && searchedPk !== null
      ? interpolateCoords(highway.coords, searchedPk)
      : null;

  function resetSavedEvent() {
    setSavedRef(null);
    setPersistedMessage(null);
  }

  function computeSearch(pk: number, dir: string) {
    if (!highway) return;
    const result = findNearestLocation(highway, pk, dir);
    if (!result) return;
    setSearchedPk(pk);
    setLocResult(result);
    resetSavedEvent();
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
    resetSavedEvent();
  }

  function handleDirectionChange(dir: string) {
    setDirection(dir);
    if (searchedPk !== null) computeSearch(searchedPk, dir);
  }

  function handleStateChange(next: EventStateId) {
    if (next === eventState) return;

    const nextAllowed = allowedHighwayIds(next);
    if (highwayId && !nextAllowed.includes(highwayId)) {
      const first = highways.find((h) => nextAllowed.includes(h.id));
      setHighwayId(first?.id ?? "");
      setDirection(first?.dirA ?? "");
      setPkText("");
      setSearchedPk(null);
      setLocResult(null);
      resetSavedEvent();
    }

    setEventState(next);
  }

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
    const sources = sourceIds
      .map(
        (id) =>
          catalogs.detectionSources?.data?.find((s) => s.id === id)?.label ??
          "",
      )
      .filter((label) => label.length > 0);
    return buildAdmMessage({
      colorEmoji: color.emoji,
      typeLabel: type.label,
      highwayId: highway.id,
      pk: searchedPk,
      location: locationText ?? "",
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
    sourceIds,
    catalogs,
    locationText,
  ]);

  const confirmedPkLabel = useMemo(
    () =>
      status?.id === "confirme" && searchedPk !== null
        ? formatPk(searchedPk)
        : null,
    [status, searchedPk],
  );

  const locationLine = useMemo(() => {
    if (
      status?.id !== "confirme" ||
      !highway ||
      searchedPk === null ||
      locationText === null
    ) {
      return null;
    }
    return `📍 *${highway.id} / PK ${formatPkKm(searchedPk)} / ${locationText} ➡️ ${destText}*`;
  }, [status, highway, searchedPk, locationText, destText]);

  const bilanMessage = useMemo(() => {
    if (bilanOpts.vehiclesMissing) return null;
    if (!bilanOpts.bilanLabel || !color || !eventReady || !status) return null;
    return buildBilanMessage({
      colorEmoji: color.emoji,
      bilanLabel: bilanOpts.bilanLabel,
      statusLabel: status.label,
      confirmedPkLabel,
      locationLine,
      ...bilanOpts.suffix,
    });
  }, [
    bilanOpts.bilanLabel,
    bilanOpts.suffix,
    bilanOpts.vehiclesMissing,
    color,
    eventReady,
    status,
    confirmedPkLabel,
    locationLine,
  ]);

  async function persistSearchMessage(): Promise<string | null> {
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
        sourceIds,
        statusId: status.id,
        message: admMessage,
      });
      await refreshHistory();
      setSavedRef(created.refCode);
      setPersistedMessage(admMessage);
      return created.refCode;
    } catch {
      notify("Enregistrement impossible.", "error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSearch() {
    const ref = await persistSearchMessage();
    if (ref !== null) notify(`Événement ${ref} enregistré.`, "ok");
  }

  async function handleBilan() {
    if (!admMessage) return;
    const ref = savedRef ?? (await persistSearchMessage());
    if (ref === null) return;
    setPersistedMessage(admMessage);
    setEventState("confirme");
    setStepIndex(2);
  }

  async function handleSaveBilan() {
    if (bilanOpts.vehiclesMissing) {
      notify("Sélectionnez au moins un véhicule.", "error");
      return;
    }
    if (!bilanMessage || !eventReady || !status || !color || !highway) return;
    setSaving(true);
    try {
      const created = await api.createHistory({
        highway: highway.id,
        pk: searchedPk,
        direction,
        color: color.id,
        typeId: bilanOpts.bilanType?.id ?? "autre",
        sourceIds,
        statusId: status.id,
        message: bilanMessage,
        replyTo: savedRef ?? undefined,
        bilan: toBilanData(bilanOpts),
      });
      await refreshHistory();
      notify(`Bilan ${created.refCode} enregistré.`, "ok");
    } catch {
      notify("Enregistrement du bilan impossible.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePdf() {
    if (bilanOpts.vehiclesMissing) {
      notify(
        "Sélectionnez au moins un véhicule avant l'export du PDF.",
        "error",
      );
      return;
    }
    if (
      !bilanMessage ||
      !eventReady ||
      !bilanOpts.bilanLabel ||
      !status ||
      !color ||
      !highway ||
      searchedPk === null
    )
      return;
    try {
      await exportBilanPdf({
        refCode: savedRef ?? "SANS-REF",
        at: new Date().toISOString(),
        highwayId: highway.id,
        highwayName: highway.name,
        pk: formatPk(searchedPk),
        direction: `${direction} · ${formatPkKm(searchedPk)} km`,
        colorLabel: color.label,
        colorHex: color.hex,
        admMessage: persistedMessage ?? "",
        bilanMessage,
        typeLabel: bilanOpts.bilanLabel,
        lanes: bilanOpts.laneLabels,
        impacts: bilanOpts.impactLabel
          ? [
              ...(bilanOpts.trafficJamMeters > 0
                ? [bilanOpts.impactLabel, `${bilanOpts.trafficJamMeters} m`]
                : [bilanOpts.impactLabel]),
            ]
          : [],
        damages: bilanOpts.damageLabels,
        actors:
          bilanOpts.actorLabels.length > 0
            ? [
                bilanOpts.actorLabels.join(", ") +
                  (bilanOpts.actionStatusLabel
                    ? ` ${bilanOpts.actionStatusLabel}`
                    : ""),
              ]
            : [],
        statusLabel: status.label,
        victimesLabel: bilanOpts.hasCorporel
          ? (() => {
              const parts: string[] = [];
              if (bilanOpts.victimes.bl > 0) parts.push(`${bilanOpts.victimes.bl} BL`);
              if (bilanOpts.victimes.bg > 0) parts.push(`${bilanOpts.victimes.bg} BG`);
              if (bilanOpts.victimes.tues > 0)
                parts.push(
                  `${bilanOpts.victimes.tues} Tué${bilanOpts.victimes.tues > 1 ? "s" : ""}`,
                );
              return parts.length > 0 ? parts.join(" · ") : null;
            })()
          : null,
      });
      notify("Bilan exporté au format PDF.", "ok");
    } catch {
      notify("Export PDF impossible.", "error");
    }
  }

  const isConfirmer = eventState === "confirmer";

  const steps: {
    id: "localiser" | "caracteriser" | "message" | "bilan";
    label: string;
  }[] = isConfirmer
    ? [
        { id: "localiser", label: "Localiser" },
        { id: "caracteriser", label: "Caractériser" },
        { id: "message", label: "Message" },
        { id: "bilan", label: "Bilan" },
      ]
    : [
        { id: "localiser", label: "Localiser" },
        { id: "caracteriser", label: "Caractériser" },
        { id: "bilan", label: "Bilan" },
        { id: "message", label: "Message" },
      ];

  const currentStep = steps[stepIndex] ?? steps[0];

  const messageReady = color !== null && type !== null && status !== null;
  const characterReady =
    color !== null && status !== null && (!isConfirmer || type !== null);
  const canEstablishBilan = messageReady && admMessage !== null && !saving;

  function goToStep(index: number) {
    setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
  }

  function stepAction() {
    const next = () => goToStep(stepIndex + 1);
    if (currentStep.id === "localiser") {
      return (
        <Button onClick={next} disabled={!eventReady} className="px-4">
          Continuer
        </Button>
      );
    }
    if (currentStep.id === "caracteriser") {
      return (
        <Button onClick={next} disabled={!characterReady} className="px-4">
          Continuer
        </Button>
      );
    }
    if (currentStep.id === "bilan") {
      return isConfirmer ? (
        <Button
          onClick={() => void handleBilan()}
          disabled={!canEstablishBilan}
          className="px-4"
        >
          Établir le bilan
        </Button>
      ) : (
        <Button onClick={next} className="px-4">
          Voir le message
        </Button>
      );
    }
    return isConfirmer ? (
      <Button
        onClick={() => void handleBilan()}
        disabled={!canEstablishBilan}
        className="px-4"
      >
        Établir le bilan
      </Button>
    ) : (
      <Button
        onClick={handlePdf}
        disabled={!bilanMessage || !bilanOpts.bilanLabel}
        className="px-4"
      >
        Exporter PDF
      </Button>
    );
  }

  return (
    <section aria-label="Événement" className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <p className="font-display text-3xl text-ink">Événement</p>
        <p className="mt-1 text-base text-ink-soft">
          {isConfirmer
            ? "Repérez et confirmez un événement sur le réseau autoroutier."
            : "Localisez, caractérisez l'événement puis générez le message ADM."}
        </p>
      </div>

      <Card className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">
              État de l'événement
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Sélectionnez l'état, puis avancez étape par étape.
            </p>
          </div>
          {savedRef && (
            <span className="text-xs font-semibold whitespace-nowrap text-ok">
              Réf. {savedRef}
            </span>
          )}
        </div>
        <div className="mt-3">
          <EventStateSelector value={eventState} onChange={handleStateChange} />
        </div>
        <nav
          aria-label="Étapes de l'événement"
          className="mt-4 grid grid-cols-4 gap-1 border-t border-line pt-3"
        >
          {steps.map((item, index) => {
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToStep(index)}
                aria-current={active ? "step" : undefined}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 text-center transition-colors ${
                  active
                    ? "text-adm-700"
                    : "text-ink-faint hover:bg-adm-50 hover:text-adm-700"
                }`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full border text-xs font-bold ${
                    active
                      ? "border-adm-600 bg-adm-600 text-white"
                      : done
                        ? "border-ok bg-ok/10 text-ok"
                        : "border-line bg-card"
                  }`}
                >
                  {done ? (
                    <svg
                      aria-hidden="true"
                      className="size-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="text-[11px] leading-tight font-semibold">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </Card>

      {currentStep.id === "localiser" && (
        <>
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
              allowedIds={allowedHighwayIds(eventState)}
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

      {eventReady && highway && locationText !== null && (
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
              style={{
                backgroundColor: color?.hex ?? "var(--color-ink-faint)",
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-base leading-snug font-bold text-ink">
                📍 {highway.id} · PK {formatPkKm(searchedPk)} · {locationText} ➡️{" "}
                {destText}
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
              {eventState === "confirme" && persistedMessage && (
                <div className="mt-3 rounded-lg bg-paper px-3 py-2">
                  <MessageText text={persistedMessage} />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
        </>
      )}

      {currentStep.id === "caracteriser" && (
        <Card className="mb-4">
          <h3 className="mb-4 text-base font-bold text-adm-700">
            Informations événement
          </h3>
          {!catalogs ? (
            loadingCatalogs ? (
              <LoadingState label="Chargement des référentiels..." />
            ) : (
              <ErrorState
                message={errorCatalogs ?? "Référentiels indisponibles."}
              />
            )
          ) : (
            <div className="grid gap-5">
              <Field label="Couleur">
                <ColorSelector
                  colors={catalogs.eventColors?.data ?? []}
                  value={color}
                  onChange={setColor}
                />
              </Field>
              <Field label="Statut">
                <StatusSelector
                  statuses={statusesForState(
                    eventState,
                    catalogs.statuses?.data ?? [],
                  )}
                  value={status}
                  onChange={setStatus}
                />
              </Field>
              <Field label="Détection">
                <DetectionSelector
                  sources={
                    isConfirmer
                      ? catalogs.detectionSources?.data ?? []
                      : (catalogs.detectionSources?.data ?? []).filter(
                          (s) => s.id !== "appel-5050",
                        )
                  }
                  value={sourceIds[0] ?? null}
                  onChange={(id) => setSourceIds(id ? [id] : [])}
                />
              </Field>
              {isConfirmer && (
                <Field label="Type d'événement" htmlFor="event-type-select">
                  <EventTypeSelector
                    types={catalogs.requestTypes?.data ?? []}
                    value={type}
                    onChange={setType}
                  />
                </Field>
              )}
            </div>
          )}
        </Card>
      )}

      {currentStep.id === "message" && (
        <Card className="mb-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="mb-4 text-base font-bold text-adm-700">
              {isConfirmer
                ? "Message ADM"
                : "Message ADM « Bilan / Mise à jour »"}
            </h3>
            {savedRef && (
              <span className="text-xs font-semibold text-ok">
                Réf. {savedRef}
              </span>
            )}
          </div>

          {isConfirmer ? (
            admMessage ? (
              <MessageText text={admMessage} />
            ) : (
              <p className="text-sm text-ink-faint">
                Sélectionnez la couleur, le type et le statut pour composer le
                message ADM.
              </p>
            )
          ) : bilanMessage ? (
            <MessageText text={bilanMessage} />
          ) : (
            <p className="text-sm text-ink-faint">
              Localisez un PK, choisissez la couleur et le statut, puis
              complétez le bilan pour composer le message.
            </p>
          )}

          {isConfirmer
            ? admMessage && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const text = admMessage;
                      void copyText(text).then(() =>
                        notify("Message copié.", "ok"),
                      );
                    }}
                    className="flex-1"
                  >
                    Copier
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handleSaveSearch()}
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
              )
            : bilanMessage && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const text = bilanMessage;
                      void copyText(text).then(() =>
                        notify("Message bilan copié.", "ok"),
                      );
                    }}
                    className="flex-1"
                  >
                    Copier
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      window.open(
                        waShareUrl(bilanMessage),
                        "_blank",
                        "noopener",
                      )
                    }
                    className="flex-1"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handleSaveBilan()}
                    disabled={saving}
                    className="flex-1"
                  >
                    Enregistrer
                  </Button>
                </div>
              )}
        </Card>
      )}

      {currentStep.id === "bilan" && (
        <>
          {!isConfirmer ? (
            <>
              <div className="mb-4">
                <p className="font-display text-xl text-adm-700">
                  Bilan de l'événement confirmé
                </p>
                <p className="text-ink-soft">
                  Complétez les détails : ils seront ajoutés au message ADM.
                </p>
              </div>
              <BilanOptionsFields opts={bilanOpts} />
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={bilanOpts.reset}
                  className="flex-1"
                >
                  Réinitialiser
                </Button>
              </div>
            </>
          ) : (
            <Card className="mb-4">
              <h3 className="mb-2 text-base font-bold text-adm-700">
                Bilan de l'événement
              </h3>
              <p className="text-sm text-ink-soft">
                Le bilan s'ouvre après l'établissement du message ADM. Vérifiez
                le message ci-dessous puis lancez « Établir le bilan ».
              </p>
              <div className="mt-4 rounded-lg bg-paper px-3 py-2">
                {admMessage ? (
                  <MessageText text={admMessage} />
                ) : (
                  <p className="text-sm text-ink-faint">
                    Aucun message ADM pour le moment.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <Button
                  variant="primary"
                  fullWidth
                  disabled={!canEstablishBilan}
                  onClick={() => void handleBilan()}
                >
                  Établir le bilan
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      <div className="sticky bottom-[60px] z-20 -mx-4 border-t border-line bg-card px-4 py-3 sm:-mx-6 sm:px-6 md:bottom-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {eventReady ? (
              <>
                <span className="font-display text-sm leading-none text-adm-950">
                  {highway?.id}
                </span>
                <span className="font-mono text-sm font-bold whitespace-nowrap text-ink tabular-nums">
                  PK {searchedPk !== null ? formatPk(searchedPk) : ""}
                </span>
                <span className="hidden truncate text-xs text-ink-faint sm:inline">
                  · {direction}
                </span>
                {savedRef && (
                  <span className="hidden text-xs font-semibold whitespace-nowrap text-ok sm:inline">
                    Réf. {savedRef}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-ink-faint">
                Aucune localisation
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {stepIndex > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToStep(stepIndex - 1)}
              >
                Précédent
              </Button>
            )}
            {stepAction()}
          </div>
        </div>
      </div>
    </section>
  );
}
