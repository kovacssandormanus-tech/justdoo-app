import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project, Task } from "../drizzle/schema";

vi.mock("./llmJson", async orig => ({
  ...(await orig<typeof import("./llmJson")>()),
  kerdezJson: vi.fn(),
}));

import { kerdezJson } from "./llmJson";
import { attekintesAdatok, hetiAttekintes, mitCsinaljakMost, szurJeloltek } from "./asszisztens";
import { gyujtoelemFeladat } from "./routers";

const most = new Date(2026, 9, 23, 10, 0, 0);
const napja = (n: number) => new Date(most.getTime() - n * 24 * 60 * 60 * 1000);

function feladat(r: Partial<Task>): Task {
  return {
    id: 1,
    userId: 1,
    projectId: null,
    title: "Feladat",
    description: null,
    dueDate: null,
    status: "pending",
    lista: "kovetkezo",
    kontextus: null,
    idoigeny: null,
    energia: null,
    varakozasKire: null,
    befejezve: null,
    createdAt: most,
    updatedAt: most,
    ...r,
  };
}

function projekt(r: Partial<Project>): Project {
  return {
    id: 1,
    userId: 1,
    name: "Projekt",
    color: "#000000",
    cel: null,
    allapot: "aktiv",
    createdAt: most,
    updatedAt: most,
    ...r,
  };
}

describe("szurJeloltek", () => {
  const lista = [
    feladat({ id: 1, kontextus: "@telefon", idoigeny: 5, energia: "alacsony" }),
    feladat({ id: 2, kontextus: "@gép", idoigeny: 90, energia: "magas" }),
    feladat({ id: 3 }),
    feladat({ id: 4, kontextus: "@bárhol", idoigeny: 10 }),
    feladat({ id: 5, status: "completed" }),
  ];

  it("kontextus, idő és energia szerint szűr, a kontextus nélkülieket megtartja", () => {
    const ids = szurJeloltek(lista, { kontextus: "@telefon", idoPerc: 15, energia: "kozepes" }).map(f => f.id);
    expect(ids).toEqual([1, 3, 4]);
  });

  it("helyzet nélkül minden nyitott feladat jelölt", () => {
    expect(szurJeloltek(lista, {}).map(f => f.id)).toEqual([1, 2, 3, 4]);
  });
});

describe("mitCsinaljakMost", () => {
  beforeEach(() => vi.mocked(kerdezJson).mockReset());

  it("eldobja az AI által kitalált vagy ismételt azonosítókat", async () => {
    vi.mocked(kerdezJson).mockResolvedValue({
      osszegzes: "Hajrá",
      javaslatok: [
        { taskId: 3, indoklas: "a" },
        { taskId: 99, indoklas: "b" },
        { taskId: 3, indoklas: "c" },
        { taskId: 1, indoklas: "d" },
      ],
    });
    const v = await mitCsinaljakMost({
      feladatok: [feladat({ id: 1 }), feladat({ id: 3 })],
      projektek: [],
      helyzet: {},
      ma: most,
    });
    expect(v.javaslatok.map(j => j.taskId)).toEqual([3, 1]);
  });

  it("jelölt nélkül nem hívja az AI-t", async () => {
    const v = await mitCsinaljakMost({ feladatok: [], projektek: [], helyzet: {} });
    expect(v.javaslatok).toEqual([]);
    expect(kerdezJson).not.toHaveBeenCalled();
  });
});

describe("attekintesAdatok + hetiAttekintes", () => {
  const feladatok = [
    feladat({ id: 1, projectId: 1 }),
    feladat({ id: 2, projectId: 2, status: "completed", befejezve: napja(2) }),
    feladat({ id: 3, lista: "varakozas", varakozasKire: "Péter", createdAt: napja(10) }),
    feladat({ id: 4, lista: "varakozas", createdAt: napja(2) }),
    feladat({ id: 5, dueDate: napja(3), kontextus: "@gép" }),
    feladat({ id: 6, lista: "majd_egyszer" }),
  ];
  const projektek = [projekt({ id: 1 }), projekt({ id: 2, name: "Elakadt" }), projekt({ id: 3, allapot: "kesz" })];

  it("kiszámolja a GTD áttekintés mutatóit", () => {
    const a = attekintesAdatok({ feladatok, projektek, gyujtoDb: 4, most });
    expect(a.elakadtProjektek.map(p => p.id)).toEqual([2]);
    expect(a.regiVarakozasok.map(v => v.id)).toEqual([3]);
    expect(a.lejartak.map(l => l.id)).toEqual([5]);
    expect(a.kovetkezoDb).toBe(2);
    expect(a.kontextusNelkul).toBe(1);
    expect(a.majdEgyszerDb).toBe(1);
    expect(a.hetenKesz).toBe(1);
    expect(a.gyujtoDb).toBe(4);
  });

  it("csak elakadt projektekhez enged lépésjavaslatot", async () => {
    vi.mocked(kerdezJson).mockResolvedValue({
      osszefoglalo: "ok",
      teendok: ["a", "b", "c", "d", "e", "f", "g"],
      projektLepesek: [
        { projektId: 2, feladatcim: "X", kontextus: null, idoigeny: null, energia: null, indoklas: "" },
        { projektId: 1, feladatcim: "Y", kontextus: null, idoigeny: null, energia: null, indoklas: "" },
      ],
    });
    const v = await hetiAttekintes(attekintesAdatok({ feladatok, projektek, gyujtoDb: 0, most }), most);
    expect(v.projektLepesek.map(l => l.projektId)).toEqual([2]);
    expect(v.teendok).toHaveLength(6);
  });
});

describe("gyujtoelemFeladat", () => {
  it("elvetésnél nem hoz létre feladatot", () => {
    expect(gyujtoelemFeladat("x", { dontes: "elvetes" })).toBeNull();
  });

  it("delegálásnál a Várakozás listára kerül", () => {
    const f = gyujtoelemFeladat("Árajánlat", { dontes: "delegalas", feladatcim: "Árajánlat Pétertől", varakozasKire: "Péter" });
    expect(f).toMatchObject({ lista: "varakozas", varakozasKire: "Péter", title: "Árajánlat Pétertől" });
  });

  it("naptár döntésnél a határidő helyi dél", () => {
    const f = gyujtoelemFeladat("Fogorvos", { dontes: "naptar", hatarido: "2026-11-05" });
    expect(f?.dueDate).toEqual(new Date(2026, 10, 5, 12));
    expect(f?.lista).toBe("kovetkezo");
  });

  it("két perces tétel mára kerül", () => {
    const f = gyujtoelemFeladat("SMS", { dontes: "ketperces" }, most);
    expect(f).toMatchObject({ dueDate: most, idoigeny: 2, lista: "kovetkezo" });
  });

  it("referencia megőrzi az eredeti szöveget leírásként", () => {
    const f = gyujtoelemFeladat("Wifi jelszó: abc", { dontes: "referencia", feladatcim: "Wifi jelszó" });
    expect(f).toMatchObject({ lista: "referencia", description: "Wifi jelszó: abc" });
  });
});
