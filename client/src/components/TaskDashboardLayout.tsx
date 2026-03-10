import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Inbox, Calendar, Clock, Star, Plus, LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface TaskDashboardLayoutProps {
  children: React.ReactNode;
  currentView: 'inbox' | 'today' | 'next10days' | 'someday';
}

export default function TaskDashboardLayout({ children, currentView }: TaskDashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState('#3b82f6');

  const projectsQuery = trpc.projects.list.useQuery();
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      setProjectName('');
      setProjectColor('#3b82f6');
      setIsCreateProjectOpen(false);
      projectsQuery.refetch();
      toast.success('Project created successfully!');
    },
    onError: (error) => {
      toast.error(`Error creating project: ${error.message}`);
    },
  });

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    createProjectMutation.mutate({ name: projectName, color: projectColor });
  };

  const viewConfig = {
    inbox: { icon: Inbox, label: 'Inbox', description: 'Unscheduled tasks' },
    today: { icon: Calendar, label: 'Mai feladatok', description: 'Today\'s tasks' },
    next10days: { icon: Clock, label: 'Következő 10 nap', description: 'Next 10 days' },
    someday: { icon: Star, label: 'Valamikor talán', description: 'Someday/Maybe' },
  };

  const CurrentViewIcon = viewConfig[currentView].icon;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card shadow-subtle">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">JustDoo</h1>
            <p className="text-sm text-muted-foreground mt-1">Task Manager</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Views</p>
              {(['inbox', 'today', 'next10days', 'someday'] as const).map((view) => {
                const config = viewConfig[view];
                const Icon = config.icon;
                const isActive = currentView === view;
                return (
                  <button
                    key={view}
                    onClick={() => setLocation(`/${view}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</p>
                <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                          id="project-name"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Enter project name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="project-color">Color</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            id="project-color"
                            type="color"
                            value={projectColor}
                            onChange={(e) => setProjectColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <span className="text-sm text-muted-foreground">{projectColor}</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleCreateProject}
                        disabled={createProjectMutation.isPending}
                        className="w-full"
                      >
                        {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {projectsQuery.data?.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-muted transition-smooth cursor-pointer group"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-foreground truncate flex-1">{project.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="px-3 py-2 bg-muted rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium text-foreground truncate">{user?.name || user?.email}</p>
            </div>
            <Button
              onClick={() => {
                logout();
                setLocation('/');
              }}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-border bg-card shadow-subtle px-8 py-6">
          <div className="flex items-center gap-3">
            <CurrentViewIcon className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">{viewConfig[currentView].label}</h2>
              <p className="text-sm text-muted-foreground">{viewConfig[currentView].description}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
