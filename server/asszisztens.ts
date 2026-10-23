import type { Project, Task } from "../drizzle/schema";
import {
  ENERGIA_SORREND,
  ENERGIASZINTEK,
  KONTEXTUSOK,
  type Energia,
} from "../shared/gtd";
import { datumSzoveg, kerdezJson } from "./llmJson";

const NAP_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// "Mit csináljak most?" – GTD végrehajtás: kontextus, idő, energia, prioritás
// ---------------------------------------------------------------------------

export type MostiHelyzet = {
  kontextus?: string | null;
  idoPerc?: number | null;
  energia?: Energia | null;
};

/** A GTD négy szempontjából az első hármat (kontextus, idő, energia) kód szűri, a prioritást az AI. */
export function szurJeloltek(feladatok: Task[], helyzet: MostiHelyzet): Task[] {
  return feladatok.filter(f => {
    if (f.status !== "pending") return false;
    if (
      helyzet.kontextus &&
      f.kontextus &&
      f.kontextus !== "@bárhol" &&
      f.kontextus !== helyzet.kontextus
    ) {
      return false;
    }
    if (helyzet.idoPerc && f.idoigeny && f.idoigeny > helyzet.idoPerc) return false;
    if (helyzet.energia && f.energia && ENERGIA_SORREND[f.energia] > ENERGIA_SORREND[helyzet.energia]) {
      return false;
    }
    return true;
  });
}

export type MostiJavaslat = {
  osszegzes: string;
  javaslatok: { taskId: number; indoklas: string }[];
};

const MOST_RENDSZER = `Te egy GTD (David Allen) szerint dolgozó személyes asszisztens vagy. Magyarul, tömören válaszolsz.
A felhasználó megadja, hol van (kontextus), mennyi ideje és energiája van. A jelölt következő lépések már ezek szerint szűrve vannak.
Válassz ki legfeljebb 3 lépést, amivel most a legtöbbet nyeri. Szempontok: lejárt vagy közeli határidő, aktív projekt előrevitele, a rendelkezésre álló idő jó kihasználása, gyors győzelmek alacsony energiánál.
Csak a megadott azonosítókat használd. Az "indoklas" egy rövid mondat. Az "osszegzes" egy-két mondatos bátorító összefoglaló.`;

const MOST_SEMA = {
  name: "mit_csinaljak_most",
  strict: true,
  schema: {
    type: "object",
    properties: {
      osszegzes: { type: "string" },
      javaslatok: {
        type: "array",
        items: {
          type: "object",
          properties: {
            taskId: { type: "integer" },
            indoklas: { type: "string" },
          },
          required: ["taskId", "indoklas"],
          additionalProperties: false,
        },
      },
    },
    required: ["osszegzes", "javaslatok"],
    additionalProperties: false,
  },
};

function feladatSor(f: Task, projektek: Map<number, string>) {
  const reszek = [`#${f.id}: ${f.title}`];
  if (f.projectId && projektek.has(f.projectId)) reszek.push(`projekt: ${projektek.get(f.projectId)}`);
  if (f.dueDate) reszek.push(`határidő: ${datumSzoveg(new Date(f.dueDate))}`);
  if (f.kontextus) reszek.push(f.kontextus);
  if (f.idoigeny) reszek.push(`${f.idoigeny} perc`);
  if (f.energia) reszek.push(`energia: ${f.energia}`);
  return reszek.join(" | ");
}

export async function mitCsinaljakMost(params: {
  feladatok: Task[];
  projektek: Project[];
  helyzet: MostiHelyzet;
  ma?: Date;
}): Promise<MostiJavaslat> {
  const jeloltek = szurJeloltek(params.feladatok, params.helyzet).slice(0, 60);
  if (jeloltek.length === 0) {
    return {
      osszegzes:
        "Nincs ehhez a helyzethez illő következő lépés. Válassz másik kontextust, vagy dolgozd fel a Gyűjtőt.",
      javaslatok: [],
    };
  }

  const projektNevek = new Map(params.projektek.map(p => [p.id, p.name]));
  const uzenet = [
    `Mai dátum: ${datumSzoveg(params.ma ?? new Date())}`,
    `Kontextus: ${params.helyzet.kontextus ?? "bármi"}`,
    `Rendelkezésre álló idő: ${params.helyzet.idoPerc ? `${params.helyzet.idoPerc} perc` : "nincs megadva"}`,
    `Energia: ${params.helyzet.energia ?? "nincs megadva"}`,
    "Jelölt következő lépések:",
    ...jeloltek.map(f => feladatSor(f, projektNevek)),
  ].join("\n");

  const valasz = await kerdezJson<MostiJavaslat>(MOST_RENDSZER, uzenet, MOST_SEMA);
  const ervenyes = new Set(jeloltek.map(f => f.id));
  const lattuk = new Set<number>();
  valasz.javaslatok = valasz.javaslatok
    .filter(j => ervenyes.has(j.taskId) && !lattuk.has(j.taskId) && lattuk.add(j.taskId))
    .slice(0, 3);
  return valasz;
}

// ---------------------------------------------------------------------------
// Heti áttekintés
// ---------------------------------------------------------------------------

export type AttekintesAdatok = {
  gyujtoDb: number;
  elakadtProjektek: { id: number; name: string; cel: string | null }[];
  regiVarakozasok: { id: number; title: string; varakozasKire: string | null; napok: number }[];
  lejartak: { id: number; title: string; dueDate: Date }[];
  kontextusNelkul: number;
  kovetkezoDb: number;
  majdEgyszerDb: number;
  hetenKesz: number;
};

export function attekintesAdatok(params: {
  feladatok: Task[];
  projektek: Project[];
  gyujtoDb: number;
  most?: Date;
}): AttekintesAdatok {
  const most = params.most ?? new Date();
  const ma = new Date(most.getFullYear(), most.getMonth(), most.getDate());
  const nyitott = params.feladatok.filter(f => f.status === "pending");
  const kovetkezok = nyitott.filter(f => f.lista === "kovetkezo");

  const projektekLepessel = new Set(kovetkezok.map(f => f.projectId).filter(Boolean));
  const elakadtProjektek = params.projektek
    .filter(p => p.allapot === "aktiv" && !projektekLepessel.has(p.id))
    .map(p => ({ id: p.id, name: p.name, cel: p.cel }));

  const regiVarakozasok = nyitott
    .filter(f => f.lista === "varakozas")
    .map(f => ({
      id: f.id,
      title: f.title,
      varakozasKire: f.varakozasKire,
      napok: Math.floor((most.getTime() - new Date(f.createdAt).getTime()) / NAP_MS),
    }))
    .filter(f => f.napok >= 7);

  const lejartak = nyitott
    .filter(f => f.lista !== "referencia" && f.dueDate && new Date(f.dueDate) < ma)
    .map(f => ({ id: f.id, title: f.title, dueDate: new Date(f.dueDate!) }));

  const hetEleje = new Date(most.getTime() - 7 * NAP_MS);
  return {
    gyujtoDb: params.gyujtoDb,
    elakadtProjektek,
    regiVarakozasok,
    lejartak,
    kontextusNelkul: kovetkezok.filter(f => !f.kontextus).length,
    kovetkezoDb: kovetkezok.length,
    majdEgyszerDb: nyitott.filter(f => f.lista === "majd_egyszer").length,
    hetenKesz: params.feladatok.filter(
      f => f.status === "completed" && f.befejezve && new Date(f.befejezve) >= hetEleje
    ).length,
  };
}

export type LepesJavaslat = {
  feladatcim: string;
  kontextus: string | null;
  idoigeny: number | null;
  energia: Energia | null;
  indoklas: string;
};

export type AttekintesJavaslat = {
  osszefoglalo: string;
  teendok: string[];
  projektLepesek: (LepesJavaslat & { projektId: number })[];
};

const LEPES_TULAJDONSAGOK = {
  feladatcim: { type: "string" },
  kontextus: { type: ["string", "null"], enum: [...KONTEXTUSOK, null] },
  idoigeny: { type: ["integer", "null"] },
  energia: { type: ["string", "null"], enum: [...ENERGIASZINTEK, null] },
  indoklas: { type: "string" },
} as const;
const LEPES_KOTELEZO = ["feladatcim", "kontextus", "idoigeny", "energia", "indoklas"];

const ATTEKINTES_RENDSZER = `Te egy GTD (David Allen) szerint dolgozó személyes asszisztens vagy, aki a heti áttekintést vezeti. Magyarul, tömören és bátorítóan válaszolsz.
A heti áttekintés három lépése: kiürülés (Gyűjtő nullára), naprakésszé tétel (listák, naptár, várakozások, projektek), kreatívvá válás (Valamikor talán lista).
Kapsz egy állapotjelentést. Feladatod:
- "osszefoglalo": 2-4 mondatos összefoglaló a rendszer állapotáról.
- "teendok": legfeljebb 6 konkrét, rövid teendő az áttekintés lezárásához (pl. "Rákérdezni Péternél az árajánlatra", "Feldolgozni a Gyűjtő 4 elemét").
- "projektLepesek": minden elakadt (következő lépés nélküli) projekthez EGY javasolt következő konkrét fizikai lépés, a projekt azonosítójával.`;

const ATTEKINTES_SEMA = {
  name: "heti_attekintes",
  strict: true,
  schema: {
    type: "object",
    properties: {
      osszefoglalo: { type: "string" },
      teendok: { type: "array", items: { type: "string" } },
      projektLepesek: {
        type: "array",
        items: {
          type: "object",
          properties: { projektId: { type: "integer" }, ...LEPES_TULAJDONSAGOK },
          required: ["projektId", ...LEPES_KOTELEZO],
          additionalProperties: false,
        },
      },
    },
    required: ["osszefoglalo", "teendok", "projektLepesek"],
    additionalProperties: false,
  },
};

export async function hetiAttekintes(adatok: AttekintesAdatok, ma: Date = new Date()): Promise<AttekintesJavaslat> {
  const uzenet = [
    `Mai dátum: ${datumSzoveg(ma)}`,
    `Feldolgozatlan gyűjtőelemek: ${adatok.gyujtoDb}`,
    `Nyitott következő lépések: ${adatok.kovetkezoDb} (ebből kontextus nélkül: ${adatok.kontextusNelkul})`,
    `Valamikor talán tételek: ${adatok.majdEgyszerDb}`,
    `Az elmúlt 7 napban befejezve: ${adatok.hetenKesz}`,
    `Lejárt határidős tételek: ${adatok.lejartak.map(l => `${l.title} (${datumSzoveg(l.dueDate)})`).join("; ") || "nincs"}`,
    `Régóta (7+ napja) várakozó tételek: ${adatok.regiVarakozasok.map(v => `${v.title} – ${v.varakozasKire ?? "?"}, ${v.napok} napja`).join("; ") || "nincs"}`,
    `Elakadt projektek (nincs következő lépés): ${adatok.elakadtProjektek.map(p => `#${p.id} ${p.name}${p.cel ? ` (cél: ${p.cel})` : ""}`).join("; ") || "nincs"}`,
  ].join("\n");

  const valasz = await kerdezJson<AttekintesJavaslat>(ATTEKINTES_RENDSZER, uzenet, ATTEKINTES_SEMA);
  const elakadtIdk = new Set(adatok.elakadtProjektek.map(p => p.id));
  valasz.projektLepesek = valasz.projektLepesek.filter(l => elakadtIdk.has(l.projektId));
  valasz.teendok = valasz.teendok.slice(0, 6);
  return valasz;
}

// ---------------------------------------------------------------------------
// Projekt következő lépése
// ---------------------------------------------------------------------------

const PROJEKT_RENDSZER = `Te egy GTD (David Allen) szerint dolgozó személyes asszisztens vagy. Magyarul válaszolsz.
Egy projekthez kell javasolnod a KÖVETKEZŐ KONKRÉT FIZIKAI LÉPÉST: ige szerinti, azonnal elvégezhető tevékenység (pl. "Felhívni a könyvelőt a határidő miatt").
Ne ismételd meg a már nyitott vagy kész lépéseket. Add meg a kontextust (a megadottak közül), a becsült időt percben és az energiaigényt.
Az "indoklas" egy rövid mondat.`;

const PROJEKT_SEMA = {
  name: "projekt_kovetkezo_lepes",
  strict: true,
  schema: {
    type: "object",
    properties: LEPES_TULAJDONSAGOK,
    required: LEPES_KOTELEZO,
    additionalProperties: false,
  },
};

export async function projektKovetkezoLepes(params: {
  projekt: Project;
  feladatok: Task[];
}): Promise<LepesJavaslat> {
  const nyitott = params.feladatok.filter(f => f.status === "pending").map(f => f.title);
  const kesz = params.feladatok.filter(f => f.status === "completed").map(f => f.title).slice(-15);
  const uzenet = [
    `Projekt: ${params.projekt.name}`,
    `Kívánt eredmény: ${params.projekt.cel?.trim() || "nincs megadva"}`,
    `Nyitott lépések: ${nyitott.join("; ") || "nincs"}`,
    `Elvégzett lépések: ${kesz.join("; ") || "nincs"}`,
    `Választható kontextusok: ${KONTEXTUSOK.join(", ")}`,
  ].join("\n");
  return kerdezJson<LepesJavaslat>(PROJEKT_RENDSZER, uzenet, PROJEKT_SEMA);
}
