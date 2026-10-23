export const LISTAK = ["kovetkezo", "varakozas", "majd_egyszer", "referencia"] as const;
export type Lista = (typeof LISTAK)[number];

export const LISTA_CIMKE: Record<Lista, string> = {
  kovetkezo: "Következő lépés",
  varakozas: "Várakozás",
  majd_egyszer: "Valamikor talán",
  referencia: "Referencia",
};

export const KONTEXTUSOK = ["@gép", "@telefon", "@otthon", "@iroda", "@úton", "@bárhol"] as const;
export type Kontextus = (typeof KONTEXTUSOK)[number];

export const ENERGIASZINTEK = ["alacsony", "kozepes", "magas"] as const;
export type Energia = (typeof ENERGIASZINTEK)[number];

export const ENERGIA_CIMKE: Record<Energia, string> = {
  alacsony: "Alacsony",
  kozepes: "Közepes",
  magas: "Magas",
};

export const PROJEKT_ALLAPOTOK = ["aktiv", "majd_egyszer", "kesz"] as const;
export type ProjektAllapot = (typeof PROJEKT_ALLAPOTOK)[number];

export const PROJEKT_ALLAPOT_CIMKE: Record<ProjektAllapot, string> = {
  aktiv: "Aktív",
  majd_egyszer: "Valamikor talán",
  kesz: "Kész",
};

export const NEZETEK = ["next", "today", "next10days", "waiting", "someday", "reference"] as const;
export type Nezet = (typeof NEZETEK)[number];

export const DONTESEK = [
  "ketperces",
  "teendo",
  "naptar",
  "delegalas",
  "projekt",
  "majd_egyszer",
  "referencia",
  "elvetes",
] as const;
export type Dontes = (typeof DONTESEK)[number];

export const DONTES_CIMKE: Record<Dontes, string> = {
  ketperces: "Két perc: most",
  teendo: "Következő lépés",
  naptar: "Naptár",
  delegalas: "Delegálás",
  projekt: "Projekt",
  majd_egyszer: "Valamikor talán",
  referencia: "Referencia",
  elvetes: "Elvetés",
};

export const ENERGIA_SORREND: Record<Energia, number> = { alacsony: 1, kozepes: 2, magas: 3 };
