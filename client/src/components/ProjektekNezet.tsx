import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ChevronDown, ChevronRight, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PROJEKT_ALLAPOT_CIMKE, PROJEKT_ALLAPOTOK, type ProjektAllapot } from "@shared/gtd";
import TaskListView from "@/components/TaskListView";
import LepesJavaslatKartya from "@/components/LepesJavaslatKartya";
import type { LepesJavaslat } from "../../../server/asszisztens";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type Projekt = inferRouterOutputs<AppRouter>["projects"]["overview"][number];

function ProjektKartya({ projekt, nyitva, onToggle }: { projekt: Projekt; nyitva: boolean; onToggle: () => void }) {
  const utils = trpc.useUtils();
  const [cel, setCel] = useState(projekt.cel ?? "");
  const [javaslat, setJavaslat] = useState<LepesJavaslat | null>(null);

  useEffect(() => setCel(projekt.cel ?? ""), [projekt.cel]);

  const frissit = () => {
    utils.projects.invalidate();
    utils.tasks.invalidate();
  };
  const modosit = trpc.projects.update.useMutation({
    onSuccess: frissit,
    onError: e => toast.error(`Hiba: ${e.message}`),
  });
  const torol = trpc.projects.delete.useMutation({
    onSuccess: () => {
      frissit();
      toast.success("Projekt törölve");
    },
  });
  const ai = trpc.asszisztens.projektLepes.useMutation({
    onSuccess: setJavaslat,
    onError: e => toast.error(`Az AI most nem elérhető: ${e.message}`),
  });

  return (
    <div id={`projekt-${projekt.id}`} className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
        {nyitva ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: projekt.color }} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{projekt.name}</p>
          {projekt.cel && <p className="text-xs text-muted-foreground truncate">Cél: {projekt.cel}</p>}
        </div>
        {projekt.elakadt && (
          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3" />
            Nincs következő lépés
          </span>
        )}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {projekt.nyitottLepesek} nyitott · {projekt.keszLepesek} kész
        </span>
      </div>

      {nyitva && (
        <div className="border-t p-4 space-y-4">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Kívánt eredmény (mikor van kész?)</p>
              <Textarea
                rows={2}
                value={cel}
                onChange={e => setCel(e.target.value)}
                onBlur={() => cel !== (projekt.cel ?? "") && modosit.mutate({ id: projekt.id, cel: cel || null })}
                placeholder="pl. A konyha kész, a bútorok a helyükön vannak"
              />
            </div>
            <div className="flex gap-2 items-center sm:pt-5">
              <Select
                value={projekt.allapot}
                onValueChange={v => modosit.mutate({ id: projekt.id, allapot: v as ProjektAllapot })}
              >
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJEKT_ALLAPOTOK.map(a => (
                    <SelectItem key={a} value={a}>{PROJEKT_ALLAPOT_CIMKE[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Projekt törlése"
                onClick={() => confirm(`Törlöd a(z) „${projekt.name}” projektet? A lépései megmaradnak.`) && torol.mutate(projekt.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Button variant="outline" size="sm" className="gap-1" disabled={ai.isPending} onClick={() => ai.mutate(projekt.id)}>
              <Sparkles className="w-4 h-4" />
              {ai.isPending ? "Gondolkodom..." : "AI: következő lépés"}
            </Button>
            {javaslat && (
              <LepesJavaslatKartya projektId={projekt.id} javaslat={javaslat} onFelveve={() => setJavaslat(null)} />
            )}
          </div>

          <TaskListView projectId={projekt.id} />
        </div>
      )}
    </div>
  );
}

export default function ProjektekNezet() {
  const { data: projektek = [], isLoading } = trpc.projects.overview.useQuery();
  const [nyitott, setNyitott] = useState<Set<number>>(new Set());
  const [szuro, setSzuro] = useState<ProjektAllapot>("aktiv");

  useEffect(() => {
    const m = window.location.hash.match(/^#projekt-(\d+)$/);
    if (m) {
      const id = Number(m[1]);
      setNyitott(prev => new Set(prev).add(id));
      const p = projektek.find(x => x.id === id);
      if (p) setSzuro(p.allapot);
      setTimeout(() => document.getElementById(`projekt-${id}`)?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [projektek]);

  const lathato = projektek
    .filter(p => p.allapot === szuro)
    .sort((a, b) => Number(b.elakadt) - Number(a.elakadt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        GTD-ben projekt minden olyan cél, ami egynél több lépést igényel. Minden aktív projektnek legyen legalább egy
        következő lépése – az elakadtakat sárgával jelöljük, ezekhez az AI is tud lépést javasolni.
      </p>
      <div className="flex gap-1">
        {PROJEKT_ALLAPOTOK.map(a => (
          <Button key={a} size="sm" variant={szuro === a ? "default" : "outline"} onClick={() => setSzuro(a)}>
            {PROJEKT_ALLAPOT_CIMKE[a]} ({projektek.filter(p => p.allapot === a).length})
          </Button>
        ))}
      </div>
      {isLoading && <p className="text-muted-foreground">Betöltés...</p>}
      {!isLoading && lathato.length === 0 && (
        <div className="text-center py-10 bg-card border border-dashed rounded-lg text-muted-foreground">
          Nincs ilyen projekt. Újat az oldalsáv „+” gombjával vagy a Gyűjtő feldolgozásával hozhatsz létre.
        </div>
      )}
      <div className="space-y-3">
        {lathato.map(p => (
          <ProjektKartya
            key={p.id}
            projekt={p}
            nyitva={nyitott.has(p.id)}
            onToggle={() =>
              setNyitott(prev => {
                const uj = new Set(prev);
                if (uj.has(p.id)) uj.delete(p.id);
                else uj.add(p.id);
                return uj;
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
