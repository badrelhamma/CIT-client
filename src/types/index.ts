export type LandmarkType = "bifurcation" | "diffuseur" | "aire" | "gare";

export interface Landmark {
  pk: number;
  name: string;
  type: LandmarkType;
}

export interface MapPoint {
  pk: number;
  lon: number;
  lat: number;
}

export interface HighwayZone {
  region: string;
  pkd: number;
  pkf: number;
}

export interface Highway {
  id: string;
  name: string;
  origin: string;
  end: string;
  dirA: string;
  dirB: string;
  lengthKm: number;
  landmarks: Landmark[];
  zones: HighwayZone[];
  coords?: MapPoint[] | null;
}

export interface PendingAxis {
  id: string;
  name: string;
  dirs: string[];
}

export interface LaneDef {
  id: string;
  label: string;
}

export interface ImpactDef {
  id: string;
  label: string;
  emoji?: string;
}

export interface DamageDef {
  id: string;
  label: string;
}

export interface ActorDef {
  id: string;
  label: string;
  emoji?: string;
}

export interface ActorStatusDef {
  id: string;
  label: string;
}

export interface BilanTypeDef {
  id: string;
  template: string;
  hasVehicle: boolean;
  hasCount: boolean;
  isCustom?: boolean;
}

export interface EventColorDef {
  id: "jaune" | "orange" | "rouge";
  label: string;
  emoji: string;
  hex: string;
  soft: string;
  deep: string;
}

export interface RequestTypeDef {
  id: string;
  label: string;
}

export interface DetectionSourceDef {
  id: string;
  label: string;
}

export interface StatusDef {
  id: string;
  label: string;
}

export interface NetworkStats {
  highways: number;
  pending: number;
  totalKm: number;
  landmarks: number;
}

export interface Catalogs {
  lanes: CatalogEntry<LaneDef[]>;
  trafficImpacts: CatalogEntry<ImpactDef[]>;
  damageTypes: CatalogEntry<DamageDef[]>;
  actionActors: CatalogEntry<ActorDef[]>;
  actionStatuses: CatalogEntry<ActorStatusDef[]>;
  vehicleTypes: CatalogEntry<string[]>;
  maxVehicleChoices: CatalogEntry<number>;
  countValues: CatalogEntry<number[]>;
  bilanTypeTemplates: CatalogEntry<BilanTypeDef[]>;
  eventColors: CatalogEntry<EventColorDef[]>;
  requestTypes: CatalogEntry<RequestTypeDef[]>;
  detectionSources: CatalogEntry<DetectionSourceDef[]>;
  statuses: CatalogEntry<StatusDef[]>;
  landmarkTypeMeta: CatalogEntry<Record<LandmarkType, { label: string }>>;
  pendingAxes: CatalogEntry<PendingAxis[]>;
  networkStats: CatalogEntry<NetworkStats>;
}

export interface CatalogEntry<T> {
  version: string;
  data: T;
  seededAt: string;
}

export type EventColorId = "jaune" | "orange" | "rouge";

/** Données structurées d'un bilan (optionnelles, pour l'export Excel). */
export interface BilanData {
  label?: string;
  vehicles?: string[];
  vehicleCount?: number | null;
  lane?: string;
  impact?: string;
  trafficJamMeters?: number | null;
  damages?: string[];
  bl?: number;
  bg?: number;
  tues?: number;
  actors?: string[];
  actionStatus?: string;
}

/** Bilan / mise à jour rattaché à un événement (embedé dans le parent). */
export interface HistoryReply {
  refCode: string;
  at: string;
  highway: string;
  pk: number;
  direction: string;
  color: EventColorId;
  typeId: string;
  sourceIds: string[];
  statusId: string;
  message: string;
  bilan?: BilanData | null;
}

export interface HistoryEvent {
  id: string;
  at: string;
  highway: string;
  pk: number;
  direction: string;
  color: EventColorId;
  typeId: string;
  sourceIds: string[];
  statusId: string;
  message: string;
  refCode: string;
  replyTo: string | null;
  replySeq: number;
  resolved: boolean;
  bilan?: BilanData | null;
  replies?: HistoryReply[];
}

export type ScreenId =
  | "recherche"
  | "bilan"
  | "historique"
  | "historiqueTous"
  | "historiqueEncours"
  | "historiqueResolus"
  | "reseau"
  | "repertoire"
  | "tmd"
  | "criticite"
  | "compteRendu"
  | "listeCr"
  | "ajouterCr";

export interface HealthResponse {
  status: "ok";
  db: "connected" | "disconnected";
  uptime: number;
  timestamp: string;
}

export interface TmdEntry {
  onu: string;
  description: string;
  danger: string;
}

export type CriticiteLevelName = "Courant" | "Critique" | "Majeur";

export type CriticiteData = Record<CriticiteLevelName, string[]>;

export interface DirectoryZone {
  axe: string;
  pkd: number;
  pkf: number;
}

export interface DirectoryEntry {
  _id?: string;
  region: string;
  nom: string;
  telephone: string;
  metier: string;
  troncon: string;
  zones: DirectoryZone[];
}