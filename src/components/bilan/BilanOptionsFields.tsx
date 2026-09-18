import { Card } from "@/components/base/Card";
import { Field } from "@/components/base/Field";
import { ActorSelector } from "@/components/bilan/ActorSelector";
import { ActorStatusSelector } from "@/components/bilan/ActorStatusSelector";
import { BilanTypeSelector } from "@/components/bilan/BilanTypeSelector";
import { CountSelector } from "@/components/bilan/CountSelector";
import { DamageSelector } from "@/components/bilan/DamageSelector";
import { ImpactSelector } from "@/components/bilan/ImpactSelector";
import { LaneSelector } from "@/components/bilan/LaneSelector";
import { VehicleSelector } from "@/components/bilan/VehicleSelector";
import { VictimCounter } from "@/components/bilan/VictimCounter";
import type { BilanOptionsApi } from "@/hooks/useBilanOptions";

interface BilanOptionsFieldsProps {
  opts: BilanOptionsApi;
}

/**
 * Champs « Bilan / Mise à jour » : toutes les options proviennent des
 * référentiels data/fields (gabarits, véhicules, voies, impacts à la
 * circulation, dégâts, bilan provisoire, intervenants + position).
 */
export function BilanOptionsFields({ opts }: BilanOptionsFieldsProps) {
  return (
    <>
      <Card className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">
          Type d'événement
        </h3>
        <div className="grid gap-5">
          <Field label="Type d'événement de bilan" htmlFor="bilan-type-select">
            <BilanTypeSelector
              templates={opts.bilanTypeTemplates}
              value={opts.bilanType}
              onChange={(t) => {
                opts.setBilanType(t);
                opts.setVehicles([]);
                opts.setCount(2);
                opts.setCustomText("");
              }}
            />
          </Field>

          {opts.bilanType?.isCustom && (
            <Field label="Description personnalisée" htmlFor="bilan-custom-text">
              <textarea
                id="bilan-custom-text"
                rows={2}
                value={opts.customText}
                onChange={(e) => opts.setCustomText(e.target.value)}
                placeholder="Décrivez l'événement..."
                className="w-full resize-none rounded-lg border border-line bg-card px-4 py-3 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
              />
            </Field>
          )}

          {opts.bilanType?.hasVehicle && (
            <Field
              label={`Véhicules (max ${opts.maxVehicles})${opts.vehiclesMissing ? " — requis" : ""}`}
            >
              <VehicleSelector
                vehicles={opts.vehicleTypes}
                selected={opts.vehicles}
                max={opts.maxVehicles}
                onToggle={opts.toggleVehicle}
              />
              {opts.vehiclesMissing && (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  Sélectionnez au moins un véhicule pour continuer.
                </p>
              )}
            </Field>
          )}

          {opts.bilanType?.hasCount && (
            <Field label="Nombre">
              <CountSelector
                values={opts.countValues}
                value={opts.count}
                onChange={opts.setCount}
              />
            </Field>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">
          Voie impactée
        </h3>
        <Field label="Voies concernées">
          <LaneSelector
            lanes={opts.lanes}
            selected={opts.laneIds}
            onToggle={opts.toggleLane}
          />
        </Field>
      </Card>

      <Card className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">
          Impact sur la circulation
        </h3>
        <Field label="Impact">
          <ImpactSelector
            impacts={opts.trafficImpacts}
            value={opts.impactId}
            onChange={opts.setImpactId}
          />
        </Field>
        {opts.impactId === "bouchon" && (
          <div className="mt-3">
            <Field label="Longueur du bouchon (mètres)" htmlFor="bouchon-distance">
              <input
                id="bouchon-distance"
                inputMode="numeric"
                value={opts.bouchonMeters}
                onChange={(e) =>
                  opts.setBouchonMeters(e.target.value.replace(/\D/g, ""))
                }
                placeholder="ex. 1500"
                className="w-full rounded-lg border border-line bg-card px-4 py-3 font-mono text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
              />
            </Field>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">
          Dégâts
        </h3>
        <Field label="Nature des dégâts">
          <DamageSelector
            damages={opts.damageTypes}
            selected={opts.damageIds}
            onToggle={opts.toggleDamage}
          />
        </Field>
        {opts.hasCorporel && (
          <div className="mt-3">
            <Field label="Bilan provisoire (BL · BG · Tués)">
              <VictimCounter value={opts.victimes} onChange={opts.setVictimes} />
            </Field>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="mb-4 text-base font-bold text-adm-700">
          Action
        </h3>
        <Field label="Intervenants mobilisés">
          <ActorSelector
            actors={opts.actionActors}
            selected={opts.actorIds}
            onToggle={opts.toggleActor}
          />
        </Field>
        <div className="mt-3">
          <Field label="Position des intervenants">
            <ActorStatusSelector
              statuses={opts.actionStatuses}
              value={opts.actionStatusId}
              onChange={opts.setActionStatusId}
            />
          </Field>
        </div>
      </Card>
    </>
  );
}