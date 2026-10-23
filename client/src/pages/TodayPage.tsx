import ProtectedView from "@/components/ProtectedView";
import TaskListView from "@/components/TaskListView";

export default function TodayPage() {
  return (
    <ProtectedView view="today">
      <TaskListView view="today" />
    </ProtectedView>
  );
}
