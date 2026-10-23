import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface TaskListViewProps {
  view: 'inbox' | 'today' | 'next10days' | 'someday';
}

export default function TaskListView({ view }: TaskListViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProjectId, setTaskProjectId] = useState<string>('');

  const tasksQuery = trpc.tasks.listByView.useQuery(view);
  const projectsQuery = trpc.projects.list.useQuery();
  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      resetForm();
      setIsCreateOpen(false);
      tasksQuery.refetch();
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      toast.error(`Error creating task: ${error.message}`);
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      resetForm();
      tasksQuery.refetch();
      toast.success('Task updated successfully!');
    },
    onError: (error) => {
      toast.error(`Error updating task: ${error.message}`);
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      setDeleteId(null);
      tasksQuery.refetch();
      toast.success('Task deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Error deleting task: ${error.message}`);
    },
  });

  const toggleStatusMutation = trpc.tasks.toggleStatus.useMutation({
    onSuccess: () => {
      tasksQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Error updating task: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setTaskProjectId('');
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const dueDate = taskDueDate ? new Date(taskDueDate) : undefined;
    const projectId = taskProjectId ? parseInt(taskProjectId) : undefined;

    if (editingId) {
      updateTaskMutation.mutate({
        id: editingId,
        title: taskTitle,
        description: taskDescription || undefined,
        dueDate,
        projectId,
      });
    } else {
      createTaskMutation.mutate({
        title: taskTitle,
        description: taskDescription || undefined,
        dueDate,
        projectId,
      });
    }
  };

  const handleEditTask = (task: any) => {
    setEditingId(task.id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
    setTaskProjectId(task.projectId ? task.projectId.toString() : '');
    setIsCreateOpen(true);
  };

  const getProjectColor = (projectId: number | null) => {
    return projectsQuery.data?.find((p) => p.id === projectId)?.color || '#9ca3af';
  };

  const getProjectName = (projectId: number | null) => {
    return projectsQuery.data?.find((p) => p.id === projectId)?.name || '';
  };

  return (
    <div className="space-y-6">
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setEditingId(null);
              resetForm();
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Enter task description (optional)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="task-project">Project</Label>
              <Select value={taskProjectId} onValueChange={setTaskProjectId}>
                <SelectTrigger id="task-project">
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Project</SelectItem>
                  {projectsQuery.data?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              className="w-full"
            >
              {createTaskMutation.isPending || updateTaskMutation.isPending
                ? 'Saving...'
                : editingId
                ? 'Update Task'
                : 'Create Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {tasksQuery.isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      ) : tasksQuery.data && tasksQuery.data.length > 0 ? (
        <div className="space-y-3">
          {tasksQuery.data.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-subtle transition-smooth group"
            >
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={() => toggleStatusMutation.mutate(task.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3
                      className={`font-medium text-foreground ${
                        task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {task.projectId && (
                        <div
                          className="text-xs font-medium px-2 py-1 rounded text-white"
                          style={{ backgroundColor: getProjectColor(task.projectId) }}
                        >
                          {getProjectName(task.projectId)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditTask(task)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No tasks yet. Create one to get started!</p>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteTaskMutation.mutate(deleteId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
