import { invokeLLM } from "./_core/llm";

export const DONTESEK = ["ketperces", "teendo", "projekt", "majd_egyszer", "elvetes"] as const;
export type Dontes = (typeof DONTESEK)[number];

export type Javaslat = {
  dontes: Dontes | null;
  kerdes: string | null;
  feladatcim: string | null;
  projektnev: string | null;
  indoklas: string;
};

const RENDSZER_UZENET = `Te a David Allen-féle GTD-módszer szerint dolgozó feldolgozó asszisztens vagy. Magyarul válaszolsz.

Egy gyűjtőelemet kell feldolgozni a GTD kérdéssora szerint:
1. Van-e vele teendő? Ha nincs: "elvetes" (szemét), vagy "majd_egyszer" (később érdekes, ötlet, referencia).
2. Ha van teendő: mi a KÖVETKEZŐ KONKRÉT FIZIKAI LÉPÉS? Ezt add meg a "feladatcim" mezőben, ige szerinti, konkrét alakban (pl. "Felhívni Ákost árajánlatért", nem "Ákos").
3. Ha a lépés két percnél kevesebb időt vesz igénybe: "ketperces".
4. Ha a cél egy lépéssel nem zárható le, több lépést igényel: "projekt". Ilyenkor a "projektnev" mezőben adj rövid projektnevet, a "feladatcim" pedig a következő lépés legyen.
5. Egyébként: "teendo".

Ha a szöveg nem egyértelmű, ne találgass: a "dontes" legyen null, a "kerdes" mezőben pedig tegyél fel EGY rövid, konkrét kérdést magyarul.
A "meglevoProjektek" listát használd: ha az elem egy meglévő projekthez tartozik, a "projektnev" mezőben a pontos meglévő nevet add vissza, és a döntés "teendo" legyen.
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
      indoklas: { type: "string" },
    },
    required: ["dontes", "kerdes", "feladatcim", "projektnev", "indoklas"],
    additionalProperties: false,
  },
};

export async function feldolgozGyujtoelem(params: {
  szoveg: string;
  kontextus?: string | null;
  meglevoProjektek: string[];
}): Promise<Javaslat> {
  const felhasznaloUzenet = [
    `Gyűjtőelem: ${params.szoveg}`,
    `Korábbi tisztázó válaszok: ${params.kontextus?.trim() || "nincs"}`,
    `Meglévő projektek: ${params.meglevoProjektek.join(", ") || "nincs"}`,
  ].join("\n");

  const valasz = await invokeLLM({
    messages: [
      { role: "system", content: RENDSZER_UZENET },
      { role: "user", content: felhasznaloUzenet },
    ],
    responseFormat: { type: "json_schema", json_schema: SEMA },
  });

  const tartalom = valasz.choices[0]?.message.content;
  const szoveg =
    typeof tartalom === "string"
      ? tartalom
      : (tartalom ?? []).map(p => (p.type === "text" ? p.text : "")).join("");

  const javaslat = JSON.parse(szoveg) as Javaslat;
  // Ha az AI nem döntött és nem kérdezett, kérdezzünk vissza általánosan.
  if (!javaslat.dontes && !javaslat.kerdes) {
    javaslat.kerdes = "Mi ennek a következő konkrét lépése?";
  }
  return javaslat;
}
