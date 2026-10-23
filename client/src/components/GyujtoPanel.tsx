import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  DONTES_CIMKE,
  DONTESEK,
  ENERGIA_CIMKE,
  ENERGIASZINTEK,
  KONTEXTUSOK,
  type Dontes,
  type Energia,
} from "@shared/gtd";
import type { Javaslat } from "../../../server/feldolgozas";

const NINCS = "nincs";
const TEENDO_DONTESEK: Dontes[] = ["ketperces", "teendo", "naptar", "projekt"];

export default function GyujtoPanel() {
  const utils = trpc.useUtils();
  const { data: elemek = [] } = trpc.gyujto.list.useQuery();

  const [szoveg, setSzoveg] = useState("");
  const [aktivId, setAktivId] = useState<number | null>(null);
  const [javaslat, setJavaslat] = useState<Javaslat | null>(null);
  const [valasz, setValasz] = useState("");
  const [dontes, setDontes] = useState<Dontes>("teendo");
  const [cim, setCim] = useState("");
  const [projektnev, setProjektnev] = useState("");
  const [kontextus, setKontextus] = useState(NINCS);
  const [idoigeny, setIdoigeny] = useState("");
  const [energia, setEnergia] = useState(NINCS);
  const [varakozasKire, setVarakozasKire] = useState("");
  const [hatarido, setHatarido] = useState("");

  const hozzaad = trpc.gyujto.add.useMutation({
    onSuccess: () => {
      setSzoveg("");
      utils.gyujto.list.invalidate();
    },
    onError: e => toast.error(`Hiba: ${e.message}`),
  });

  const javasol = trpc.gyujto.javaslat.useMutation({
    onSuccess: j => {
      setJavaslat(j);
      if (j.dontes) setDontes(j.dontes);
      setCim(j.feladatcim ?? "");
      setProjektnev(j.projektnev ?? "");
      setKontextus(j.kontextus ?? NINCS);
      setIdoigeny(j.idoigeny ? String(j.idoigeny) : "");
      setEnergia(j.energia ?? NINCS);
      setVarakozasKire(j.varakozasKire ?? "");
      setHatarido(j.hatarido ?? "");
    },
    onError: e => {
      toast.error(`Az AI most nem elérhető: ${e.message}`);
      setAktivId(null);
    },
  });

  const valaszol = trpc.gyujto.valaszol.useMutation({
    onSuccess: () => {
      setValasz("");
      if (aktivId !== null) javasol.mutate({ id: aktivId });
    },
  });

  const veglegesit = trpc.gyujto.veglegesit.useMutation({
    onSuccess: (_, v) => {
      setAktivId(null);
      setJavaslat(null);
      utils.gyujto.list.invalidate();
      utils.tasks.invalidate();
      utils.projects.invalidate();
      toast.success(v.dontes === "elvetes" ? "Elvetve" : `Besorolva: ${DONTES_CIMKE[v.dontes]}`);
    },
    onError: e => toast.error(`Hiba: ${e.message}`),
  });

  const feldolgozas = (id: number) => {
    setAktivId(id);
    setJavaslat(null);
    javasol.mutate({ id });
  };

  const veglegesites = (id: number) => {
    const percek = parseInt(idoigeny);
    veglegesit.mutate({
      id,
      dontes,
      feladatcim: cim,
      projektnev,
      kontextus: kontextus === NINCS ? null : kontextus,
      idoigeny: Number.isFinite(percek) && percek > 0 ? percek : null,
      energia: energia === NINCS ? null : (energia as Energia),
      varakozasKire: varakozasKire || null,
      hatarido: hatarido || null,
    });
  };

  const teendo = TEENDO_DONTESEK.includes(dontes);

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Írj le mindent, ami foglalkoztat – feladatot, ötletet, ígéretet. Utána a „Feldolgozás” gombbal az AI a GTD
        kérdései alapján javasolja, hová kerüljön, és mi a következő konkrét lépés.
      </p>

      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          if (szoveg.trim()) hozzaad.mutate({ szoveg });
        }}
      >
        <Input value={szoveg} onChange={e => setSzoveg(e.target.value)} placeholder="Mi jár a fejedben?" />
        <Button type="submit" disabled={!szoveg.trim() || hozzaad.isPending}>
          Rögzít
        </Button>
      </form>

      {elemek.length === 0 && (
        <div className="text-center py-10 bg-card border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">A Gyűjtő üres – tiszta fej!</p>
        </div>
      )}

      <ul className="space-y-2">
        {elemek.map(elem => {
          const aktiv = aktivId === elem.id;
          return (
            <li key={elem.id} className="rounded-lg border bg-card p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm">{elem.szoveg}</span>
                {!aktiv && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 shrink-0"
                    onClick={() => feldolgozas(elem.id)}
                    disabled={javasol.isPending}
                  >
                    <Sparkles className="w-4 h-4" />
                    Feldolgozás
                  </Button>
                )}
              </div>

              {aktiv && javasol.isPending && <p className="text-sm text-muted-foreground">Gondolkodom...</p>}

              {aktiv && javaslat && javaslat.dontes === null && javaslat.kerdes && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{javaslat.kerdes}</p>
                  <div className="flex gap-2">
                    <Input value={valasz} onChange={e => setValasz(e.target.value)} placeholder="Válasz..." />
                    <Button
                      size="sm"
                      disabled={!valasz.trim() || valaszol.isPending}
                      onClick={() => valaszol.mutate({ id: elem.id, valasz })}
                    >
                      Válasz
                    </Button>
                  </div>
                </div>
              )}

              {aktiv && javaslat && javaslat.dontes && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground flex gap-1 items-start">
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                    {javaslat.indoklas}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DONTESEK.map(d => (
                      <Button
                        key={d}
                        size="sm"
                        variant={d === dontes ? "default" : "outline"}
                        onClick={() => setDontes(d)}
                      >
                        {DONTES_CIMKE[d]}
                      </Button>
                    ))}
                  </div>

                  {dontes !== "elvetes" && (
                    <div>
                      <Label>{teendo || dontes === "delegalas" ? "Következő konkrét lépés" : "Cím"}</Label>
                      <Input value={cim} onChange={e => setCim(e.target.value)} placeholder={elem.szoveg} />
                    </div>
                  )}
                  {(teendo || dontes === "delegalas") && (
                    <div>
                      <Label>Projekt {dontes === "projekt" ? "(új vagy meglévő)" : "(opcionális, meglévő)"}</Label>
                      <Input value={projektnev} onChange={e => setProjektnev(e.target.value)} placeholder="Projekt neve" />
                    </div>
                  )}
                  {dontes === "delegalas" && (
                    <div>
                      <Label>Kire vársz?</Label>
                      <Input value={varakozasKire} onChange={e => setVarakozasKire(e.target.value)} />
                    </div>
                  )}
                  {teendo && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <Label>Kontextus</Label>
                        <Select value={kontextus} onValueChange={setKontextus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NINCS}>–</SelectItem>
                            {KONTEXTUSOK.map(k => (
                              <SelectItem key={k} value={k}>{k}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Idő (perc)</Label>
                        <Input type="number" min={1} value={idoigeny} onChange={e => setIdoigeny(e.target.value)} />
                      </div>
                      <div>
                        <Label>Energia</Label>
                        <Select value={energia} onValueChange={setEnergia}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NINCS}>–</SelectItem>
                            {ENERGIASZINTEK.map(e => (
                              <SelectItem key={e} value={e}>{ENERGIA_CIMKE[e]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Határidő</Label>
                        <Input type="date" value={hatarido} onChange={e => setHatarido(e.target.value)} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" disabled={veglegesit.isPending} onClick={() => veglegesites(elem.id)}>
                      {dontes === "elvetes" ? "Elvetés" : "Besorolás"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAktivId(null);
                        setJavaslat(null);
                      }}
                    >
                      Mégse
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
