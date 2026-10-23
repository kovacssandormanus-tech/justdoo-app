import {
  DONTESEK,
  ENERGIASZINTEK,
  KONTEXTUSOK,
  type Dontes,
  type Energia,
} from "../shared/gtd";
import { datumSzoveg, kerdezJson } from "./llmJson";

export { DONTESEK };
export type { Dontes };

export type Javaslat = {
  dontes: Dontes | null;
  kerdes: string | null;
  feladatcim: string | null;
  projektnev: string | null;
  kontextus: string | null;
  idoigeny: number | null;
  energia: Energia | null;
  varakozasKire: string | null;
  hatarido: string | null;
  indoklas: string;
};

const RENDSZER_UZENET = `Te a David Allen-féle GTD-módszer szerint dolgozó feldolgozó asszisztens vagy. Magyarul válaszolsz.

Egy gyűjtőelemet kell feldolgozni a GTD kérdéssora szerint:
1. Van-e vele teendő? Ha nincs: "elvetes" (szemét), "majd_egyszer" (később érdekes ötlet), vagy "referencia" (megőrzendő információ, amivel nincs teendő).
2. Ha van teendő: mi a KÖVETKEZŐ KONKRÉT FIZIKAI LÉPÉS? Ezt add meg a "feladatcim" mezőben, ige szerinti, konkrét alakban (pl. "Felhívni Ákost árajánlatért", nem "Ákos").
3. Ha a lépés két percnél kevesebb időt vesz igénybe: "ketperces".
4. Ha a cél egy lépéssel nem zárható le, több lépést igényel: "projekt". Ilyenkor a "projektnev" mezőben adj rövid projektnevet, a "feladatcim" pedig az első következő lépés legyen.
5. Ha a lépést valaki másnak kell elvégeznie, vagy valakitől választ, anyagot várunk: "delegalas", a "varakozasKire" mezőben a személy vagy szervezet neve.
6. Ha a lépés egy konkrét naphoz kötött (időpont, határidő): "naptar", a "hatarido" mezőben a dátum ÉÉÉÉ-HH-NN alakban.
7. Egyébként: "teendo". Ha van határidő, azt is add meg a "hatarido" mezőben.

Minden teendőhöz (ketperces, teendo, naptar, projekt) javasolj:
- "kontextus": a megadott kontextusok egyike, ahol a lépés elvégezhető,
- "idoigeny": becsült idő percben,
- "energia": "alacsony", "kozepes" vagy "magas" (mennyi szellemi energiát igényel).
Ahol egy mező nem értelmezhető, legyen null.

Ha a szöveg nem egyértelmű, ne találgass: a "dontes" legyen null, a "kerdes" mezőben pedig tegyél fel EGY rövid, konkrét kérdést magyarul.
A "meglevoProjektek" listát használd: ha az elem egy meglévő projekthez tartozik, a "projektnev" mezőben a pontos meglévő nevet add vissza, és a döntés ne "projekt" legyen, hanem a lépésnek megfelelő (általában "teendo").
Az "indoklas" egy rövid mondat arról, miért ez a döntés.`;

const SEMA = {
  name: "gtd_javaslat",
  strict: true,
  schema: {
    type: "object",
    properties: {
      dontes: { type: ["string", "null"], enum: [...DONTESEK, null] },
      kerdes: { type: ["string", "null"] },
      feladatcim: { type: ["string", "null"] },
      projektnev: { type: ["string", "null"] },
      kontextus: { type: ["string", "null"], enum: [...KONTEXTUSOK, null] },
      idoigeny: { type: ["integer", "null"] },
      energia: { type: ["string", "null"], enum: [...ENERGIASZINTEK, null] },
      varakozasKire: { type: ["string", "null"] },
      hatarido: { type: ["string", "null"] },
      indoklas: { type: "string" },
    },
    required: [
      "dontes",
      "kerdes",
      "feladatcim",
      "projektnev",
      "kontextus",
      "idoigeny",
      "energia",
      "varakozasKire",
      "hatarido",
      "indoklas",
    ],
    additionalProperties: false,
  },
};

export async function feldolgozGyujtoelem(params: {
  szoveg: string;
  kontextus?: string | null;
  meglevoProjektek: string[];
  ma?: Date;
}): Promise<Javaslat> {
  const felhasznaloUzenet = [
    `Mai dátum: ${datumSzoveg(params.ma ?? new Date())}`,
    `Gyűjtőelem: ${params.szoveg}`,
    `Korábbi tisztázó válaszok: ${params.kontextus?.trim() || "nincs"}`,
    `Meglévő projektek: ${params.meglevoProjektek.join(", ") || "nincs"}`,
    `Választható kontextusok: ${KONTEXTUSOK.join(", ")}`,
  ].join("\n");

  const javaslat = await kerdezJson<Javaslat>(RENDSZER_UZENET, felhasznaloUzenet, SEMA);

  if (javaslat.hatarido && !/^\d{4}-\d{2}-\d{2}$/.test(javaslat.hatarido)) {
    javaslat.hatarido = null;
  }
  // Ha az AI nem döntött és nem kérdezett, kérdezzünk vissza általánosan.
  if (!javaslat.dontes && !javaslat.kerdes) {
    javaslat.kerdes = "Mi ennek a következő konkrét lépése?";
  }
  return javaslat;
}
