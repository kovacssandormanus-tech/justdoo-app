import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";
import LepesJavaslatKartya from "@/components/LepesJavaslatKartya";

type Lepes = { cim: string; leiras: string; link?: string; ok?: boolean };

export default function HetiAttekintes() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: allapot } = trpc.asszisztens.attekintesAllapot.useQuery();
  const [pipak, setPipak] = useState<Set<string>>(new Set());

  const ai = trpc.asszisztens.hetiAttekintes.useMutation({
    onError: e => toast.error(`Az AI most nem elérhető: ${e.message}`),
  });
  const kesz = trpc.asszisztens.attekintesKesz.useMutation({
    onSuccess: () => {
      utils.asszisztens.attekintesAllapot.invalidate();
      utils.auth.me.invalidate();
      setPipak(new Set());
      toast.success("Heti áttekintés lezárva. Szép munka!");
    },
  });

  if (!allapot) return <p className="text-muted-foreground">Betöltés...</p>;

  const szakaszok: { cim: string; lepesek: Lepes[] }[] = [
    {
      cim: "1. Kiürülés",
      lepesek: [
        { cim: "Gyűjts össze minden szabad papírt, jegyzetet, e-mailt", leiras: "Írd be őket a Gyűjtőbe." },
        { cim: "Agyürítés", leiras: "Írj le mindent, ami még a fejedben jár.", link: "/inbox" },
        {
          cim: "Gyűjtő nullára",
          leiras: `${allapot.gyujtoDb} feldolgozatlan elem`,
          link: "/inbox",
          ok: allapot.gyujtoDb === 0,
        },
      ],
    },
    {
      cim: "2. Naprakésszé tétel",
      lepesek: [
        {
          cim: "Következő lépések átnézése",
          leiras: `${allapot.kovetkezoDb} nyitott lépés, ${allapot.kontextusNelkul} kontextus nélkül`,
          link: "/next",
        },
        {
          cim: "Naptár: elmúlt és közelgő határidők",
          leiras: `${allapot.lejartak.length} lejárt tétel`,
          link: "/today",
          ok: allapot.lejartak.length === 0,
        },
        {
          cim: "Várakozás lista",
          leiras: `${allapot.regiVarakozasok.length} tétel vár 7+ napja – kérdezz rá!`,
          link: "/waiting",
          ok: allapot.regiVarakozasok.length === 0,
        },
        {
          cim: "Projektek: mindegyiknek van következő lépése?",
          leiras: `${allapot.elakadtProjektek.length} elakadt projekt`,
          link: "/projects",
          ok: allapot.elakadtProjektek.length === 0,
        },
      ],
    },
    {
      cim: "3. Kreativitás",
      lepesek: [
        {
          cim: "Valamikor talán lista",
          leiras: `${allapot.majdEgyszerDb} tétel – van, amit most aktiválnál vagy törölnél?`,
          link: "/someday",
        },
        { cim: "Új ötletek", leiras: "Merész, kreatív ötletek a Gyűjtőbe.", link: "/inbox" },
      ],
    },
  ];

  const osszes = szakaszok.flatMap(s => s.lepesek).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {allapot.utolsoAttekintes
            ? `Utolsó áttekintés: ${format(new Date(allapot.utolsoAttekintes), "yyyy.MM.dd.")} (${formatDistanceToNow(
                new Date(allapot.utolsoAttekintes),
                { locale: hu, addSuffix: true }
              )})`
            : "Még nem volt heti áttekintés."}{" "}
          Ezen a héten befejezve: <strong>{allapot.hetenKesz}</strong> lépés.
        </p>
        <Button className="gap-2" disabled={ai.isPending} onClick={() => ai.mutate()}>
          <Sparkles className="w-4 h-4" />
          {ai.isPending ? "Elemzem..." : "AI-összefoglaló"}
        </Button>
      </div>

      {ai.data && (
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Az asszisztens összefoglalója
          </h3>
          <p className="text-sm">{ai.data.osszefoglalo}</p>
          {ai.data.teendok.length > 0 && (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {ai.data.teendok.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {ai.data.projektLepesek.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Javasolt lépések az elakadt projektekhez</p>
              {ai.data.projektLepesek.map(l => (
                <div key={l.projektId}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {allapot.elakadtProjektek.find(p => p.id === l.projektId)?.name}
                  </p>
                  <LepesJavaslatKartya projektId={l.projektId} javaslat={l} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {szakaszok.map(sz => (
        <section key={sz.cim} className="space-y-2">
          <h3 className="font-semibold">{sz.cim}</h3>
          {sz.lepesek.map(l => {
            const kulcs = `${sz.cim}-${l.cim}`;
            return (
              <div key={kulcs} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <Checkbox
                  className="mt-1"
                  checked={pipak.has(kulcs)}
                  onCheckedChange={() =>
                    setPipak(prev => {
                      const uj = new Set(prev);
                      if (uj.has(kulcs)) uj.delete(kulcs);
                      else uj.add(kulcs);
                      return uj;
                    })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {l.cim}
                    {l.ok && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{l.leiras}</p>
                </div>
                {l.link && (
                  <Button size="sm" variant="ghost" onClick={() => setLocation(l.link!)}>
                    Megnyit
                  </Button>
                )}
              </div>
            );
          })}
        </section>
      ))}

      <Button
        className="gap-2"
        disabled={kesz.isPending || pipak.size < osszes}
        onClick={() => kesz.mutate()}
        title={pipak.size < osszes ? "Pipáld ki az összes lépést" : undefined}
      >
        <CheckCircle2 className="w-4 h-4" />
        Áttekintés lezárása ({pipak.size}/{osszes})
      </Button>
    </div>
  );
}
