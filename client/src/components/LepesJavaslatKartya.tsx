import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { LepesJavaslat } from "../../../server/asszisztens";

/** AI által javasolt következő lépés, egy kattintással felvehető a projekthez. */
export default function LepesJavaslatKartya({
  projektId,
  javaslat,
  onFelveve,
}: {
  projektId: number;
  javaslat: LepesJavaslat;
  onFelveve?: () => void;
}) {
  const utils = trpc.useUtils();
  const felvesz = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.invalidate();
      utils.projects.overview.invalidate();
      utils.asszisztens.attekintesAllapot.invalidate();
      toast.success("Következő lépés felvéve");
      onFelveve?.();
    },
    onError: e => toast.error(`Hiba: ${e.message}`),
  });

  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-muted/50 p-3">
      <div>
        <p className="text-sm font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          {javaslat.feladatcim}
        </p>
        <p className="text-xs text-muted-foreground">
          {[javaslat.kontextus, javaslat.idoigeny && `${javaslat.idoigeny} perc`].filter(Boolean).join(" · ")}
          {javaslat.indoklas ? ` – ${javaslat.indoklas}` : ""}
        </p>
      </div>
      <Button
        size="sm"
        disabled={felvesz.isPending || felvesz.isSuccess}
        onClick={() =>
          felvesz.mutate({
            title: javaslat.feladatcim,
            projectId: projektId,
            lista: "kovetkezo",
            kontextus: javaslat.kontextus,
            idoigeny: javaslat.idoigeny,
            energia: javaslat.energia,
          })
        }
      >
        {felvesz.isSuccess ? "Felvéve" : "Felvesz"}
      </Button>
    </div>
  );
}
