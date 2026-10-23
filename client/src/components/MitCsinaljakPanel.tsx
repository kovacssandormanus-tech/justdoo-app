import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ENERGIA_CIMKE, ENERGIASZINTEK, KONTEXTUSOK, type Energia } from "@shared/gtd";

const BARMI = "barmi";
const IDOK = ["5", "15", "30", "60", "120"];

export default function MitCsinaljakPanel() {
  const utils = trpc.useUtils();
  const [kontextus, setKontextus] = useState(BARMI);
  const [ido, setIdo] = useState(BARMI);
  const [energia, setEnergia] = useState(BARMI);

  const kerdez = trpc.asszisztens.mitCsinaljak.useMutation({
    onError: e => toast.error(`Az AI most nem elérhető: ${e.message}`),
  });
  const pipal = trpc.tasks.toggleStatus.useMutation({
    onSuccess: () => {
      utils.tasks.invalidate();
      utils.projects.overview.invalidate();
    },
  });

  return (
    <section className="mb-6 rounded-lg border bg-card p-4 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Mit csináljak most?
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <Label>Hol vagy?</Label>
          <Select value={kontextus} onValueChange={setKontextus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={BARMI}>Bárhol</SelectItem>
              {KONTEXTUSOK.filter(k => k !== "@bárhol").map(k => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mennyi időd van?</Label>
          <Select value={ido} onValueChange={setIdo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={BARMI}>Nem számít</SelectItem>
              {IDOK.map(i => (
                <SelectItem key={i} value={i}>{i} perc</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Energiád</Label>
          <Select value={energia} onValueChange={setEnergia}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={BARMI}>Nem számít</SelectItem>
              {ENERGIASZINTEK.map(e => (
                <SelectItem key={e} value={e}>{ENERGIA_CIMKE[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="gap-2"
          disabled={kerdez.isPending}
          onClick={() =>
            kerdez.mutate({
              kontextus: kontextus === BARMI ? null : kontextus,
              idoPerc: ido === BARMI ? null : parseInt(ido),
              energia: energia === BARMI ? null : (energia as Energia),
            })
          }
        >
          <Sparkles className="w-4 h-4" />
          {kerdez.isPending ? "Gondolkodom..." : "Javasolj!"}
        </Button>
      </div>

      {kerdez.data && (
        <div className="space-y-2 pt-2">
          <p className="text-sm">{kerdez.data.osszegzes}</p>
          {kerdez.data.javaslatok.map((j, i) => (
            <div key={j.taskId} className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
              <Checkbox
                className="mt-1"
                checked={j.feladat.status === "completed" || (pipal.isSuccess && pipal.variables === j.taskId)}
                onCheckedChange={() => pipal.mutate(j.taskId)}
              />
              <div>
                <p className="font-medium text-sm">
                  {i + 1}. {j.feladat.title}
                </p>
                <p className="text-xs text-muted-foreground">{j.indoklas}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
