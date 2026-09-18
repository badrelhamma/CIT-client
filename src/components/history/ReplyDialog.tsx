import { useMemo, useState } from "react";
import { Button } from "@/components/base/Button";
import { Dialog } from "@/components/base/Dialog";
import { Field } from "@/components/base/Field";
import { MessageText } from "@/components/base/MessageText";
import { PkSign } from "@/components/base/PkSign";
import { DirectionSelector } from "@/components/search/DirectionSelector";
import { HighwaySelector } from "@/components/search/HighwaySelector";
import { PkInput } from "@/components/search/PkInput";
import { ColorSelector } from "@/components/search/ColorSelector";
import { BilanOptionsFields } from "@/components/bilan/BilanOptionsFields";
import { StatusSelector } from "@/components/search/StatusSelector";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { useBilanOptions, toBilanData } from "@/hooks/useBilanOptions";
import { api } from "@/services/api";
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
import { copyText, waShareUrl } from "@/services/share";
import type {
  Catalogs,
  EventColorDef,
  HistoryEvent,
  StatusDef,
} from "@/types";

interface ReplyDialogProps {
  event: HistoryEvent;
  catalogs: Catalogs;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

/** Fenêtre « Répondre » : bilan de l'événement confirmé, pré-rempli avec la
 *  localisation de l'événement ciblé. La réponse est rattachée à l'événement
 *  parent via replyTo (modifications / séquence gérées côté serveur). */
export function ReplyDialog({
  event,
  catalogs,
  onClose,
  onSaved,
}: ReplyDialogProps) {
  const { notify } = useToast();
  const { highways } = useData();
  const bilanOpts = useBilanOptions(catalogs);

  const [status, setStatus] = useState<StatusDef | null>(
    catalogs.statuses.data.find((s) => s.id === event.statusId) ?? null,
  );
  const [color, setColor] = useState<EventColorDef | null>(
    catalogs.eventColors.data.find((c) => c.id === event.color) ?? null,
  );
  const [saving, setSaving] = useState(false);

  const [highwayId, setHighwayId] = useState(event.highway);
  const [direction, setDirection] = useState(event.direction);
  const [pkText, setPkText] = useState(() => formatPk(event.pk));
  const [searchedPk, setSearchedPk] = useState<number | null>(event.pk);
  const [locResult, setLocResult] = useState<LocationResult | null>(() => {
    const hw = highways.find((h) => h.id === event.highway);
    return hw ? findNearestLocation(hw, event.pk, event.direction) : null;
  });

  const highway = highways.find((h) => h.id === highwayId) ?? null;

  const colorDef = color;

  const parsedPk = highway ? parsePk(pkText, highway) : null;

  const eventReady = highway !== null && searchedPk !== null && direction !== "";

  const locationText = eventReady
    ? locationLabel(highway!, searchedPk!, direction)
    : "";

  const destText = locResult?.destination ?? "";

  const eventTypeLabel =
    catalogs.requestTypes.data.find((t) => t.id === event.typeId)?.label ??
    event.typeId;

  /* Le type du message ADM est celui sélectionné dans les options du bilan
     (et non le type d'événement d'origine, conservé pour l'en-tête). */
  const messageTypeLabel = bilanOpts.bilanLabel;

  const confirmedPkLabel =
    status?.id === "confirme" && searchedPk !== null
      ? formatPk(searchedPk)
      : null;

  const bilanMessage = useMemo(() => {
    if (bilanOpts.vehiclesMissing) return null;
    if (!bilanOpts.bilanLabel || !colorDef || !status) return null;
    return buildBilanMessage({
      colorEmoji: colorDef.emoji,
      bilanLabel: messageTypeLabel,
      statusLabel: status.label,
      confirmedPkLabel,
      ...bilanOpts.suffix,
    });
  }, [
    bilanOpts.bilanLabel,
    bilanOpts.suffix,
    bilanOpts.vehiclesMissing,
    colorDef,
    status,
    confirmedPkLabel,
    messageTypeLabel,
  ]);

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
    setSearchedPk(null);
    setLocResult(null);
  }

  function handleDirectionChange(dir: string) {
    setDirection(dir);
    if (searchedPk !== null && highway) {
      recomputeLocation(searchedPk, dir);
    }
  }

  async function handleSave() {
    if (!eventReady) {
      notify("Localisez le PK avant d'enregistrer la réponse.", "error");
      return;
    }
    if (bilanOpts.vehiclesMissing) {
      notify("Sélectionnez au moins un véhicule.", "error");
      return;
    }
    if (!bilanMessage || !status || !colorDef) {
      notify("Complétez les champs du bilan pour enregistrer.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.replyHistory(event.id, {
        color: colorDef.id,
        typeId: bilanOpts.bilanType?.id ?? event.typeId,
        sourceIds: [],
        statusId: status.id,
        message: bilanMessage,
        bilan: toBilanData(bilanOpts),
      });
      await api.updateHistory(event.id, {
        color: colorDef.id,
        typeId: bilanOpts.bilanType?.id ?? event.typeId,
        statusId: status.id,
      });
      await onSaved();
      notify(`Bilan ${event.refCode} enregistré.`, "ok");
      onClose();
    } catch {
      notify("Enregistrement de la réponse impossible.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      title={`Répondre — Bilan de l'événement ${event.refCode}`}
      onClose={onClose}
    >
      <div className="mb-4 rounded-xl border border-line bg-adm-50/70 p-4">
        <PkSign axe={event.highway} pk={formatPk(event.pk)} className="mb-3" />
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-1 size-3 shrink-0 rounded-full"
            style={{ backgroundColor: colorDef?.hex ?? "#7c8ea3" }}
          />
          <div className="min-w-0">
            <p className="text-sm leading-snug font-bold text-ink">
              📍 {event.highway} · PK {formatPkKm(event.pk)} · {locationText} ➡️{" "}
              {destText || "—"}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {eventTypeLabel}
              {event.resolved ? " · Résolu" : " · En cours"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="mb-4 text-base font-bold text-ink">Recherche PK</h2>
        <div className="grid gap-4">
          <Field label="Axes" htmlFor="reply-highway-select">
            <HighwaySelector
              value={highwayId}
              onChange={handleHighwayChange}
            />
          </Field>

          <Field label="PK" htmlFor="reply-pk-input">
            <PkInput
              value={pkText}
              onChange={setPkText}
              validPk={parsedPk}
              onEnter={handleSearch}
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Localiser
            </Button>
          </div>
        </div>
      </div>

      <BilanOptionsFields opts={bilanOpts} />

      <div className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">Statut</h3>
        <Field label="Statut de la réponse">
          <StatusSelector
            statuses={catalogs.statuses.data}
            value={status}
            onChange={setStatus}
          />
        </Field>
      </div>

      <div className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">Couleur</h3>
        <ColorSelector
          colors={catalogs.eventColors.data}
          value={color}
          onChange={setColor}
        />
      </div>

      <h3 className="mb-3 text-base font-bold text-adm-700">
        Message ADM « Bilan / Mise à jour »
      </h3>
      {bilanMessage ? (
        <MessageText text={bilanMessage} />
      ) : (
        <p className="text-sm text-ink-faint">
          Sélectionnez le type, les voies, impacts et le statut pour composer
          le message.
        </p>
      )}

      {bilanMessage && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              void copyText(bilanMessage).then(() =>
                notify("Message copié.", "ok"),
              );
            }}
          >
            Copier
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              window.open(waShareUrl(bilanMessage), "_blank", "noopener")
            }
          >
            WhatsApp
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={saving}
            className="ml-auto"
          >
            {saving ? "Enregistrement..." : "Enregistrer la réponse"}
          </Button>
        </div>
      )}
    </Dialog>
  );
}