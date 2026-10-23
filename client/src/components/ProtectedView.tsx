import { useAuth } from "@/_core/hooks/useAuth";
import TaskDashboardLayout, { type GtdView } from "@/components/TaskDashboardLayout";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";

export default function ProtectedView({ view, children }: { view: GtdView; children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Betöltés...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <TaskDashboardLayout currentView={view}>{children}</TaskDashboardLayout>;
}
