import { useAuth } from "@/_core/hooks/useAuth";
import TaskDashboardLayout from "@/components/TaskDashboardLayout";
import TaskListView from "@/components/TaskListView";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function SomedayPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TaskDashboardLayout currentView="someday">
      <TaskListView view="someday" />
    </TaskDashboardLayout>
  );
}
