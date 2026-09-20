// PROMISE-PSMA (miTNM V2) scoring logic.
// Pure, framework-agnostic functions so the report code can be unit-reasoned
// about independently of the UI. Terminology follows the PROMISE V2 criteria.

export type Reason = "initial" | "bcr" | "nmcrpc" | "mhspc" | "mcrpc";
export type Focality = "none" | "unifocal" | "multifocal";
export type PrimaryScore = "" | "3" | "4" | "5";
/** -1 = not assessed (n/a); 0..3 = miPSMA expression level. */
export type PsmaLevel = -1 | 0 | 1 | 2 | 3;

export interface TumorState {
  prostateRemoved: boolean;
  focality: Focality;
  extracapsular: boolean; // T3a
  svLeft: boolean; // seminal vesicle L -> T3b
  svRight: boolean; // seminal vesicle R -> T3b
  adjacent: boolean; // bladder / rectum / pelvic wall -> T4
  primary: PrimaryScore;
}

export interface NodeState {
  extIliacL: boolean;
  extIliacR: boolean;
  intIliacL: boolean;
  intIliacR: boolean;
  obturatorL: boolean;
  obturatorR: boolean;
  presacral: boolean;
  otherPelvic: boolean;
}

export interface M1aState {
  commonIliacL: boolean;
  commonIliacR: boolean;
  retroperitoneal: boolean;
  supradiaphragmatic: boolean;
  inguinalOther: boolean;
}

export interface BoneState {
  count: number; // discrete bone lesions
  diffuseMarrow: boolean; // dmi
}

export interface OrganState {
  liver: boolean;
  lung: boolean;
  adrenal: boolean;
  brain: boolean;
  other: boolean;
}

export interface PsmaState {
  lowest: PsmaLevel;
  highest: PsmaLevel;
}

export interface ReportState {
  patientId: string;
  petDate: string;
  reason: Reason | "";
  tumor: TumorState;
  nodes: NodeState;
  m1a: M1aState;
  bone: BoneState;
  organs: OrganState;
  psma: PsmaState;
}

export const initialState: ReportState = {
  patientId: "",
  petDate: "",
  reason: "",
  tumor: {
    prostateRemoved: false,
    focality: "none",
    extracapsular: false,
    svLeft: false,
    svRight: false,
    adjacent: false,
    primary: "",
  },
  nodes: {
    extIliacL: false,
    extIliacR: false,
    intIliacL: false,
    intIliacR: false,
    obturatorL: false,
    obturatorR: false,
    presacral: false,
    otherPelvic: false,
  },
  m1a: {
    commonIliacL: false,
    commonIliacR: false,
    retroperitoneal: false,
    supradiaphragmatic: false,
    inguinalOther: false,
  },
  bone: { count: 0, diffuseMarrow: false },
  organs: { liver: false, lung: false, adrenal: false, brain: false, other: false },
  psma: { lowest: -1, highest: -1 },
};

// ----------------------------------------------------------------------------
// Category helpers
// ----------------------------------------------------------------------------

export interface TResult {
  category: string;
  description: string;
}

export function tCategory(t: TumorState): TResult {
  const hasLocal = t.extracapsular || t.svLeft || t.svRight || t.adjacent || t.focality !== "none";
  if (t.prostateRemoved) {
    return hasLocal
      ? { category: "Tr", description: "Recurrencia local en el lecho prostático" }
      : { category: "T0", description: "Sin tumor local detectable" };
  }
  if (t.adjacent) return { category: "T4", description: "Invasión de estructuras adyacentes (vejiga / recto / pared pélvica)" };
  if (t.svLeft || t.svRight) return { category: "T3b", description: "Invasión de vesícula(s) seminal(es)" };
  if (t.extracapsular) return { category: "T3a", description: "Extensión extracapsular" };
  if (t.focality === "multifocal") return { category: "T2m", description: "Tumor intraprostático multifocal" };
  if (t.focality === "unifocal") return { category: "T2u", description: "Tumor intraprostático unifocal" };
  return { category: "T0", description: "Sin tumor local detectable" };
}

const NODE_TOKENS: Record<keyof NodeState, string> = {
  extIliacL: "EIL",
  extIliacR: "EIR",
  intIliacL: "IIL",
  intIliacR: "IIR",
  obturatorL: "OBL",
  obturatorR: "OBR",
  presacral: "PS",
  otherPelvic: "OP",
};

// Base region (ignoring laterality) determines N1 (one region) vs N2 (>=2).
const NODE_BASE: Record<keyof NodeState, string> = {
  extIliacL: "EI",
  extIliacR: "EI",
  intIliacL: "II",
  intIliacR: "II",
  obturatorL: "OB",
  obturatorR: "OB",
  presacral: "PS",
  otherPelvic: "OP",
};

export interface NResult {
  category: string;
  description: string;
  tokens: string[];
}

export function nCategory(n: NodeState): NResult {
  const selected = (Object.keys(n) as (keyof NodeState)[]).filter((k) => n[k]);
  if (selected.length === 0) {
    return { category: "N0", description: "Sin compromiso ganglionar pélvico", tokens: [] };
  }
  const baseRegions = new Set(selected.map((k) => NODE_BASE[k]));
  const category = baseRegions.size >= 2 ? "N2" : "N1";
  const description =
    category === "N2"
      ? "Ganglios pélvicos en 2 o más regiones"
      : "Ganglios pélvicos en una sola región";
  return { category, description, tokens: selected.map((k) => NODE_TOKENS[k]) };
}

const M1A_TOKENS: Record<keyof M1aState, string> = {
  commonIliacL: "CIL",
  commonIliacR: "CIR",
  retroperitoneal: "RP",
  supradiaphragmatic: "supradiaph",
  inguinalOther: "inguinal",
};

const ORGAN_TOKENS: Record<keyof OrganState, string> = {
  liver: "hep",
  lung: "pul",
  adrenal: "adr",
  brain: "brain",
  other: "other",
};

export interface MResult {
  category: string; // "M0" | "M1"
  parts: string[]; // e.g. ["M1a (RP)", "M1b (oligo)"]
  descriptions: string[];
}

export function boneSpread(count: number): "" | "uni" | "oligo" | "diss" {
  if (count <= 0) return "";
  if (count === 1) return "uni";
  if (count <= 3) return "oligo";
  return "diss";
}

export function mResult(m1a: M1aState, bone: BoneState, organs: OrganState): MResult {
  const parts: string[] = [];
  const descriptions: string[] = [];

  const m1aSel = (Object.keys(m1a) as (keyof M1aState)[]).filter((k) => m1a[k]);
  if (m1aSel.length) {
    parts.push(`M1a (${m1aSel.map((k) => M1A_TOKENS[k]).join(",")})`);
    descriptions.push("M1a: ganglios linfáticos extrapélvicos");
  }

  const spread = boneSpread(bone.count);
  if (spread || bone.diffuseMarrow) {
    const bits: string[] = [];
    if (spread) bits.push(spread);
    if (bone.diffuseMarrow) bits.push("dmi");
    parts.push(`M1b (${bits.join(",")})`);
    descriptions.push("M1b: metástasis óseas");
  }

  const organSel = (Object.keys(organs) as (keyof OrganState)[]).filter((k) => organs[k]);
  if (organSel.length) {
    parts.push(`M1c (${organSel.map((k) => ORGAN_TOKENS[k]).join(",")})`);
    descriptions.push("M1c: metástasis en órganos");
  }

  if (parts.length === 0) {
    return { category: "M0", parts: [], descriptions: ["Sin metástasis a distancia"] };
  }
  return { category: "M1", parts, descriptions };
}

export interface PromiseReport {
  code: string;
  t: TResult;
  n: NResult;
  m: MResult;
  primary: string;
  psma: string;
}

export function buildReport(state: ReportState): PromiseReport {
  const t = tCategory(state.tumor);
  const n = nCategory(state.nodes);
  const m = mResult(state.m1a, state.bone, state.organs);

  let code = "mi " + t.category;

  const primaryEnabled = !state.tumor.prostateRemoved && state.tumor.primary !== "";
  if (primaryEnabled) {
    code += ` (PRIMARY${state.tumor.primary})`;
  }

  code += ` ${n.category}`;
  if (n.tokens.length) code += ` (${n.tokens.join(",")})`;

  code += m.category === "M0" ? " M0" : " " + m.parts.join(" ");

  let psmaText = "";
  if (state.psma.lowest >= 0 || state.psma.highest >= 0) {
    const hi = state.psma.highest >= 0 ? state.psma.highest : "n/a";
    const lo = state.psma.lowest >= 0 ? state.psma.lowest : "n/a";
    psmaText = `PSMA expression score highest ${hi} lowest ${lo}`;
    code += ` / ${psmaText}`;
  }

  return {
    code,
    t,
    n,
    m,
    primary: primaryEnabled ? `PRIMARY ${state.tumor.primary}` : "",
    psma: psmaText,
  };
}
