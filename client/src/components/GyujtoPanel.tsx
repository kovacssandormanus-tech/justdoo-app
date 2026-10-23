import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Dontes = "ketperces" | "teendo" | "projekt" | "majd_egyszer" | "elvetes";

type Javaslat = {
  dontes: Dontes | null;
  kerdes: string | null;
  feladatcim: string | null;
  projektnev: string | null;
  indoklas: string;
};

const DONTES_CIMKE: Record<Dontes, string> = {
  ketperces: "Két perc: most",
  teendo: "Teendő",
  projekt: "Projekt",
  majd_egyszer: "Valamikor talán",
  elvetes: "Elvetés",
};

export default function GyujtoPanel() {
  const utils = trpc.useUtils();
  const { data: elemek = [] } = trpc.gyujto.list.useQuery();

  const [szoveg, setSzoveg] = useState("");
  const [aktivId, setAktivId] = useState<number | null>(null);
  const [javaslat, setJavaslat] = useState<Javaslat | null>(null);
  const [valasz, setValasz] = useState("");
  const [cim, setCim] = useState("");
  const [projektnev, setProjektnev] = useState("");

  const hozzaad = trpc.gyujto.add.useMutation({
    onSuccess: () => {
      setSzoveg("");
      utils.gyujto.list.invalidate();
    },
  });

  const javasol = trpc.gyujto.javaslat.useMutation({
    onSuccess: j => {
      setJavaslat(j);
      setCim(j.feladatcim ?? "");
      setProjektnev(j.projektnev ?? "");
    },
  });

  const valaszol = trpc.gyujto.valaszol.useMutation({
    onSuccess: () => {
      setValasz("");
      if (aktivId !== null) javasol.mutate({ id: aktivId });
    },
  });

  const veglegesit = trpc.gyujto.veglegesit.useMutation({
    onSuccess: () => {
      setAktivId(null);
      setJavaslat(null);
      utils.gyujto.list.invalidate();
      utils.tasks.listByView.invalidate();
      utils.projects.list.invalidate();
    },
  });

  const feldolgozas = (id: number) => {
    setAktivId(id);
    setJavaslat(null);
    javasol.mutate({ id });
  };

  return (
    <section className="mb-6 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Gyűjtő
      </h2>

      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          if (szoveg.trim()) hozzaad.mutate({ szoveg });
        }}
      >
        <Input
          value={szoveg}
          onChange={e => setSzoveg(e.target.value)}
          placeholder="Mi jut eszedbe?"
        />
        <Button type="submit" disabled={!szoveg.trim() || hozzaad.isPending}>
          Rögzít
        </Button>
      </form>

      {elemek.length === 0 && (
        <p className="text-sm text-muted-foreground">A gyűjtő üres.</p>
      )}

      <ul className="space-y-2">
        {elemek.map(elem => {
          const aktiv = aktivId === elem.id;
          return (
            <li key={elem.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm">{elem.szoveg}</span>
                {!aktiv && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => feldolgozas(elem.id)}
                    disabled={javasol.isPending}
                  >
                    Feldolgozás
                  </Button>
                )}
              </div>

              {aktiv && javasol.isPending && (
                <p className="text-sm text-muted-foreground">Gondolkodom...</p>
              )}

              {aktiv && javaslat && javaslat.dontes === null && javaslat.kerdes && (
                <div className="space-y-2">
                  <p className="text-sm">{javaslat.kerdes}</p>
                  <div className="flex gap-2">
                    <Input
                      value={valasz}
                      onChange={e => setValasz(e.target.value)}
                      placeholder="Válasz..."
                    />
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
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{javaslat.indoklas}</p>
                  <Input
                    value={cim}
                    onChange={e => setCim(e.target.value)}
                    placeholder="Következő lépés"
                  />
                  {javaslat.dontes === "projekt" && (
                    <Input
                      value={projektnev}
                      onChange={e => setProjektnev(e.target.value)}
                      placeholder="Projekt neve"
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(DONTES_CIMKE) as Dontes[]).map(d => (
                      <Button
                        key={d}
                        size="sm"
                        variant={d === javaslat.dontes ? "default" : "outline"}
                        disabled={veglegesit.isPending}
                        onClick={() =>
                          veglegesit.mutate({
                            id: elem.id,
                            dontes: d,
                            feladatcim: cim,
                            projektnev,
                          })
                        }
                      >
                        {DONTES_CIMKE[d]}
                      </Button>
                    ))}
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
