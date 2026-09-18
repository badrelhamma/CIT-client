import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { ErrorState } from "@/components/base/ErrorState";
import { Field } from "@/components/base/Field";
import { LoadingState } from "@/components/base/LoadingState";
import { MessageText } from "@/components/base/MessageText";
import { PkSign } from "@/components/base/PkSign";
import { BilanOptionsFields } from "@/components/bilan/BilanOptionsFields";
import { ColorSelector } from "@/components/search/ColorSelector";
import { DetectionSelector } from "@/components/search/DetectionSelector";
import { DirectionSelector } from "@/components/search/DirectionSelector";
import { HighwaySelector } from "@/components/search/HighwaySelector";
import { PkInput } from "@/components/search/PkInput";
import { StatusSelector } from "@/components/search/StatusSelector";
import { useData } from "@/contexts/DataContext";
import { useEvent } from "@/contexts/EventContext";
import { useToast } from "@/contexts/ToastContext";
import { toBilanData, useBilanOptions } from "@/hooks/useBilanOptions";
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
import { buildBilanMessage } from "@/services/message";
import { exportBilanPdf } from "@/services/pdf";
import { copyText, waShareUrl } from "@/services/share";
import type { EventColorId, StatusDef } from "@/types";

/* Ordre d'affichage des axes dans le bilan : axes puis pénétrantes. */
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

export function BilanScreen() {
  const { highways, catalogs, loadingCatalogs, errorCatalogs, refreshHistory } =
    useData();
  const {
    highway: ctxHighway,
    pk: ctxPk,
    direction: ctxDirection,
    color: ctxColor,
    status: ctxStatus,
    message: ctxMessage,
    refCode: ctxRefCode,
  } = useEvent();
  const { notify } = useToast();

  const bilanOpts = useBilanOptions(catalogs);

  const pkInputRef = useRef<HTMLInputElement>(null);

  const [highwayId, setHighwayId] = useState(ctxHighway?.id ?? "");
  const [direction, setDirection] = useState(ctxDirection ?? "");
  const [pkText, setPkText] = useState(
    ctxHighway && ctxPk !== null ? formatPk(ctxPk) : "",
  );
  const [searchedPk, setSearchedPk] = useState<number | null>(ctxPk);
  const [locResult, setLocResult] = useState<LocationResult | null>(() =>
    ctxHighway && ctxPk !== null
      ? findNearestLocation(ctxHighway, ctxPk, ctxDirection ?? "")
      : null,
  );
  const [colorId, setColorId] = useState<EventColorId | null>(ctxColor);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusDef | null>(ctxStatus);
  const [saving, setSaving] = useState(false);

  const highway = highways.find((h) => h.id === highwayId) ?? null;

  useEffect(() => {
    if (!status && catalogs) {
      const def =
        catalogs.statuses.data.find((s) => s.id === "confirme") ??
        catalogs.statuses.data[0] ??
        null;
      setStatus(def);
    }
  }, [status, catalogs]);

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

  const eventReady = highway !== null && searchedPk !== null && direction !== "";

  const locationText = eventReady ? locationLabel(highway!, searchedPk!, direction) : null;

  const destText = locResult?.destination ?? "";

  const colorDef = colorId
    ? catalogs?.eventColors.data.find((c) => c.id === colorId) ?? null
    : null;

  const locationLine =
    status?.id === "confirme" && eventReady
      ? `📍 *${highway!.id} / PK ${formatPkKm(searchedPk!)} / ${locationText ?? ""} ➡️ ${destText}*`
      : null;

  const confirmedPkLabel =
    status?.id === "confirme" && searchedPk !== null
      ? formatPk(searchedPk)
      : null;

  const bilanMessage = useMemo(() => {
    if (bilanOpts.vehiclesMissing) return null;
    if (!bilanOpts.bilanLabel || !colorDef || !eventReady || !status) return null;
    return buildBilanMessage({
      colorEmoji: colorDef.emoji,
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
    colorDef,
    eventReady,
    status,
    confirmedPkLabel,
    locationLine,
  ]);

  const gpsPoint =
    highway && searchedPk !== null
      ? interpolateCoords(highway.coords, searchedPk)
      : null;

  function recomputeLocation(pk: number, dir: string) {
    if (!highway) return;
    const result = findNearestLocation(highway, pk, dir);
    setSearchedPk(pk);
    setLocResult(result);
  }

  function handleSearch() {
    if (!highway || parsedPk === null) {
      notify("PK invalide pour l'axe sélectionné.", "error");
      return;
    }
    recomputeLocation(parsedPk, direction);
  }

  function handleRandom() {
    if (!highway) return;
    const pk = randomPk(highway);
    if (pk === null) return;
    setPkText(formatPk(pk));
    recomputeLocation(pk, direction);
  }

  function handleHighwayChange(id: string) {
    const next = highways.find((h) => h.id === id);
    setHighwayId(id);
    if (next) setDirection(next.dirA);
    setPkText("");
    setSearchedPk(null);
    setLocResult(null);
  }

  function handleDirectionChange(dir: string) {
    setDirection(dir);
    if (searchedPk !== null) recomputeLocation(searchedPk, dir);
  }

  async function handleSave() {
    if (bilanOpts.vehiclesMissing) {
      notify("Sélectionnez au moins un véhicule.", "error");
      return;
    }
    if (!bilanMessage || !eventReady || !status || !colorDef || !highway) return;
    setSaving(true);
    try {
      const created = await api.createHistory({
        highway: highway.id,
        pk: searchedPk!,
        direction,
        color: colorDef.id,
        typeId: bilanOpts.bilanType?.id ?? "autre",
        sourceIds,
        statusId: status.id,
        message: bilanMessage,
        replyTo: ctxRefCode ?? undefined,
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

  function handlePdf() {
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
      !colorDef ||
      !highway
    )
      return;
    exportBilanPdf({
      refCode: ctxRefCode ?? "SANS-REF",
      at: new Date().toISOString(),
      highwayId: highway.id,
      highwayName: highway.name,
      pk: formatPk(searchedPk!),
      direction: `${direction} · ${formatPkKm(searchedPk!)} km`,
      colorLabel: colorDef.label,
      colorHex: colorDef.hex,
      admMessage: ctxMessage ?? "",
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
  }

  if (!catalogs) {
    return (
      <section aria-label="Bilan">
        {loadingCatalogs ? (
          <LoadingState label="Chargement des référentiels..." />
        ) : (
          <ErrorState message={errorCatalogs ?? "Référentiels indisponibles."} />
        )}
      </section>
    );
  }

  return (
    <section aria-label="Bilan" className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <p className="font-display text-3xl text-ink">Bilan d'événement</p>
          <p className="mt-1 text-base text-ink-soft">
            Localisez, caractérisez l'événement puis générez le message ADM.
          </p>
        </div>
        {ctxRefCode && (
          <span className="text-xs font-semibold whitespace-nowrap text-ok">
            Réf. {ctxRefCode}
          </span>
        )}
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
              allowedIds={BILAN_HIGHWAY_IDS}
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
            <Button
              variant="secondary"
              onClick={handleRandom}
              className="flex-1"
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
            pk={formatPk(searchedPk!)}
            className="mb-3"
          />
          <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ backgroundColor: colorDef?.hex ?? "#7c8ea3" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-base leading-snug font-bold text-ink">
                  📍 {highway.id} · PK {formatPkKm(searchedPk!)} · {locationText} ➡️{" "}
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
                      title={`Localisation ${highway.id} PK ${formatPkKm(searchedPk!)}`}
                      src={`https://maps.google.com/maps?q=${gpsPoint.lat},${gpsPoint.lon}&z=16&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="block h-64 w-full max-w-full border-0"
                    />
                  </div>
                )}
                {ctxMessage && (
                  <div className="mt-3 rounded-lg bg-paper px-3 py-2">
                    <MessageText text={ctxMessage} />
                  </div>
                )}
              </div>
            </div>
        </Card>
      )}

      <Card className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">
          Informations événement
        </h3>
        <div className="grid gap-5">
          <Field label="Couleur">
            <ColorSelector
              colors={catalogs.eventColors.data}
              value={colorDef}
              onChange={(c) => setColorId(c.id)}
            />
          </Field>
          <Field label="Statut">
            <StatusSelector
              statuses={catalogs.statuses.data.filter(
                (s) => s.id !== "confirmer" && s.id !== "cloture",
              )}
              value={status}
              onChange={setStatus}
            />
          </Field>
          <Field label="Détection">
            <DetectionSelector
              sources={catalogs.detectionSources.data.filter(
                (s) => s.id !== "appel-5050",
              )}
              value={sourceIds[0] ?? null}
              onChange={(id) => setSourceIds(id ? [id] : [])}
            />
          </Field>
        </div>
      </Card>

      <div className="mb-4">
        <p className="font-display text-xl text-adm-700">
          Bilan de l'événement confirmé
        </p>
        <p className="text-ink-soft">
          Complétez les détails : ils seront ajoutés au message ADM.
        </p>
      </div>
      <BilanOptionsFields opts={bilanOpts} />

      <Card className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">
          Message ADM « Bilan / Mise à jour »
        </h3>
        {bilanMessage ? (
          <MessageText text={bilanMessage} />
        ) : (
          <p className="text-sm text-ink-faint">
            Localisez un PK, choisissez la couleur et le statut, puis complétez
            le bilan pour composer le message.
          </p>
        )}

        {bilanMessage && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => {
                void copyText(bilanMessage).then(() =>
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
                window.open(waShareUrl(bilanMessage), "_blank", "noopener")
              }
              className="flex-1"
            >
              WhatsApp
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex-1"
            >
              Enregistrer
            </Button>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" onClick={bilanOpts.reset} className="flex-1">
          Réinitialiser
        </Button>
        <Button
          variant="primary"
          onClick={handlePdf}
          disabled={!bilanMessage || !bilanOpts.bilanLabel}
          className="flex-1"
        >
          Exporter PDF
        </Button>
      </div>
    </section>
  );
}