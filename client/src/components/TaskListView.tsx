import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, Calendar, Clock, MapPin, Zap, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ENERGIA_CIMKE,
  ENERGIASZINTEK,
  KONTEXTUSOK,
  LISTA_CIMKE,
  LISTAK,
  type Energia,
  type Lista,
  type Nezet,
} from "@shared/gtd";

interface TaskListViewProps {
  view?: Nezet;
  projectId?: number;
}

const NINCS = "nincs";

const NEZET_LISTA: Record<Nezet, Lista> = {
  next: "kovetkezo",
  today: "kovetkezo",
  next10days: "kovetkezo",
  waiting: "varakozas",
  someday: "majd_egyszer",
  reference: "referencia",
};

const URES_SZOVEG: Record<Nezet, string> = {
  next: "Nincs nyitott következő lépés. Dolgozd fel a Gyűjtőt!",
  today: "Mára nincs határidős teendő.",
  next10days: "A következő 10 napra nincs határidős teendő.",
  waiting: "Senkire sem vársz.",
  someday: "A Valamikor talán lista üres.",
  reference: "Nincs referenciaanyag.",
};

function maiDatum() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function TaskListView({ view = "next", projectId }: TaskListViewProps) {
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [kontextusSzuro, setKontextusSzuro] = useState<string>("osszes");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskProjectId, setTaskProjectId] = useState<string>(NINCS);
  const [lista, setLista] = useState<Lista>("kovetkezo");
  const [kontextus, setKontextus] = useState<string>(NINCS);
  const [idoigeny, setIdoigeny] = useState("");
  const [energia, setEnergia] = useState<string>(NINCS);
  const [varakozasKire, setVarakozasKire] = useState("");

  const viewQuery = trpc.tasks.listByView.useQuery(view, { enabled: projectId === undefined });
  const projectQuery = trpc.tasks.listByProject.useQuery(projectId ?? 0, {
    enabled: projectId !== undefined,
  });
  const tasksQuery = projectId !== undefined ? projectQuery : viewQuery;
  const projectsQuery = trpc.projects.list.useQuery();

  const frissit = () => {
    utils.tasks.invalidate();
    utils.projects.overview.invalidate();
    utils.asszisztens.attekintesAllapot.invalidate();
  };

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false);
      frissit();
      toast.success("Feladat létrehozva");
    },
    onError: error => toast.error(`Hiba: ${error.message}`),
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      setIsCreateOpen(false);
      frissit();
      toast.success("Feladat mentve");
    },
    onError: error => toast.error(`Hiba: ${error.message}`),
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      setDeleteId(null);
      frissit();
      toast.success("Feladat törölve");
    },
    onError: error => toast.error(`Hiba: ${error.message}`),
  });

  const toggleStatusMutation = trpc.tasks.toggleStatus.useMutation({
    onSuccess: frissit,
    onError: error => toast.error(`Hiba: ${error.message}`),
  });

  const ujFeladat = () => {
    setEditingId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate(view === "today" ? maiDatum() : "");
    setTaskProjectId(projectId ? String(projectId) : NINCS);
    setLista(NEZET_LISTA[view]);
    setKontextus(view === "next" && kontextusSzuro !== "osszes" ? kontextusSzuro : NINCS);
    setIdoigeny("");
    setEnergia(NINCS);
    setVarakozasKire("");
    setIsCreateOpen(true);
  };

  const handleEditTask = (task: NonNullable<typeof tasksQuery.data>[number]) => {
    setEditingId(task.id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
    setTaskProjectId(task.projectId ? task.projectId.toString() : NINCS);
    setLista(task.lista);
    setKontextus(task.kontextus || NINCS);
    setIdoigeny(task.idoigeny ? String(task.idoigeny) : "");
    setEnergia(task.energia || NINCS);
    setVarakozasKire(task.varakozasKire || "");
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!taskTitle.trim()) {
      toast.error("Add meg a feladat címét");
      return;
    }
    const percek = parseInt(idoigeny);
    const mezok = {
      title: taskTitle,
      description: taskDescription || undefined,
      lista,
      kontextus: kontextus === NINCS ? null : kontextus,
      idoigeny: Number.isFinite(percek) && percek > 0 ? percek : null,
      energia: energia === NINCS ? null : (energia as Energia),
      varakozasKire: lista === "varakozas" ? varakozasKire.trim() || null : null,
    };
    const dueDate = taskDueDate ? new Date(`${taskDueDate}T12:00:00`) : undefined;
    const pid = taskProjectId !== NINCS ? parseInt(taskProjectId) : undefined;

    if (editingId) {
      updateTaskMutation.mutate({ id: editingId, ...mezok, dueDate: dueDate ?? null, projectId: pid ?? null });
    } else {
      createTaskMutation.mutate({ ...mezok, dueDate, projectId: pid });
    }
  };

  const getProject = (id: number | null) => projectsQuery.data?.find(p => p.id === id);

  const feladatok = (tasksQuery.data ?? []).filter(
    t =>
      view !== "next" ||
      projectId !== undefined ||
      kontextusSzuro === "osszes" ||
      t.kontextus === kontextusSzuro ||
      (kontextusSzuro === "nincs_kontextus" && !t.kontextus)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={ujFeladat} className="gap-2">
          <Plus className="w-4 h-4" />
          Új feladat
        </Button>
        {view === "next" && projectId === undefined && (
          <div className="flex flex-wrap gap-1">
            {["osszes", ...KONTEXTUSOK, "nincs_kontextus"].map(k => (
              <Button
                key={k}
                size="sm"
                variant={kontextusSzuro === k ? "default" : "outline"}
                onClick={() => setKontextusSzuro(k)}
              >
                {k === "osszes" ? "Mind" : k === "nincs_kontextus" ? "Kontextus nélkül" : k}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Feladat szerkesztése" : "Új feladat"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Következő konkrét lépés</Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="pl. Felhívni Ákost az árajánlatért"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Megjegyzés</Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={e => setTaskDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lista</Label>
                <Select value={lista} onValueChange={v => setLista(v as Lista)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LISTAK.map(l => (
                      <SelectItem key={l} value={l}>{LISTA_CIMKE[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-due-date">Határidő</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            {lista === "varakozas" && (
              <div>
                <Label htmlFor="task-kire">Kire várok?</Label>
                <Input
                  id="task-kire"
                  value={varakozasKire}
                  onChange={e => setVarakozasKire(e.target.value)}
                  placeholder="pl. Péter"
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
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
                <Label htmlFor="task-ido">Idő (perc)</Label>
                <Input
                  id="task-ido"
                  type="number"
                  min={1}
                  value={idoigeny}
                  onChange={e => setIdoigeny(e.target.value)}
                />
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
            </div>
            <div>
              <Label>Projekt</Label>
              <Select value={taskProjectId} onValueChange={setTaskProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NINCS}>Nincs projekt</SelectItem>
                  {projectsQuery.data?.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSave}
              disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              className="w-full"
            >
              {createTaskMutation.isPending || updateTaskMutation.isPending ? "Mentés..." : "Mentés"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {tasksQuery.isLoading ? (
        <p className="text-center py-12 text-muted-foreground">Betöltés...</p>
      ) : feladatok.length > 0 ? (
        <div className="space-y-3">
          {feladatok.map(task => {
            const projekt = getProject(task.projectId);
            const lejart =
              task.status === "pending" && task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());
            return (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-subtle transition-smooth group"
              >
                {task.lista !== "referencia" && (
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => toggleStatusMutation.mutate(task.id)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3
                        className={`font-medium text-foreground ${
                          task.status === "completed" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 px-2 py-1 rounded ${
                              lejart ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.dueDate), "yyyy.MM.dd.")}
                          </span>
                        )}
                        {task.lista === "varakozas" && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-800">
                            <User className="w-3 h-3" />
                            {task.varakozasKire || "Várakozás"}
                          </span>
                        )}
                        {task.kontextus && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {task.kontextus}
                          </span>
                        )}
                        {task.idoigeny && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {task.idoigeny} perc
                          </span>
                        )}
                        {task.energia && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground">
                            <Zap className="w-3 h-3" />
                            {ENERGIA_CIMKE[task.energia]}
                          </span>
                        )}
                        {projectId !== undefined && task.lista !== "kovetkezo" && (
                          <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                            {LISTA_CIMKE[task.lista]}
                          </span>
                        )}
                        {projekt && projectId === undefined && (
                          <span
                            className="font-medium px-2 py-1 rounded text-white"
                            style={{ backgroundColor: projekt.color }}
                          >
                            {projekt.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" onClick={() => handleEditTask(task)} aria-label="Szerkesztés">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(task.id)} aria-label="Törlés">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">
            {projectId !== undefined ? "Ennek a projektnek még nincs lépése." : URES_SZOVEG[view]}
          </p>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feladat törlése</AlertDialogTitle>
            <AlertDialogDescription>Biztosan törlöd? Ez nem vonható vissza.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteTaskMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Törlés
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
