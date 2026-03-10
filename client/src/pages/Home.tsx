import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Inbox, Calendar, Clock, Star, CheckCircle2, Zap } from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/inbox');
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              JustDoo
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              An elegant task manager designed for clarity and focus. Organize your tasks into four intuitive views and stay on top of what matters.
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-foreground text-center mb-16">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Inbox */}
          <div className="p-6 bg-card border border-border rounded-lg shadow-subtle hover:shadow-elevated transition-smooth">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-4">
              <Inbox className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Inbox</h3>
            <p className="text-sm text-muted-foreground">
              Capture unscheduled tasks quickly without worrying about dates
            </p>
          </div>

          {/* Today */}
          <div className="p-6 bg-card border border-border rounded-lg shadow-subtle hover:shadow-elevated transition-smooth">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-4">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Mai feladatok</h3>
            <p className="text-sm text-muted-foreground">
              Focus on what needs to be done today with a clear view
            </p>
          </div>

          {/* Next 10 Days */}
          <div className="p-6 bg-card border border-border rounded-lg shadow-subtle hover:shadow-elevated transition-smooth">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-4">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Következő 10 nap</h3>
            <p className="text-sm text-muted-foreground">
              Plan ahead and see tasks coming up in the next 10 days
            </p>
          </div>

          {/* Someday */}
          <div className="p-6 bg-card border border-border rounded-lg shadow-subtle hover:shadow-elevated transition-smooth">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-4">
              <Star className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Valamikor talán</h3>
            <p className="text-sm text-muted-foreground">
              Keep track of ideas and tasks for the future
            </p>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Organize with Projects
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Assign tasks to projects and keep your work organized. Each project has its own color for quick visual identification.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-accent" />
                  <span className="text-foreground">Create unlimited projects</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-accent" />
                  <span className="text-foreground">Assign tasks to multiple projects</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-accent" />
                  <span className="text-foreground">Customize project colors</span>
                </li>
              </ul>
            </div>
            <div className="bg-muted rounded-lg p-8 h-64 flex items-center justify-center">
              <p className="text-muted-foreground text-center">Project management preview</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-6">
          Ready to get organized?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Start using JustDoo today and take control of your tasks
        </p>
        <Button
          size="lg"
          onClick={() => window.location.href = getLoginUrl()}
          className="gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Sign In
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
          <p>JustDoo - An elegant task manager for focused productivity</p>
        </div>
      </div>
    </div>
  );
}
