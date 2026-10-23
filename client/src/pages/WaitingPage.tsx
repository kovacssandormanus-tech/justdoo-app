import ProtectedView from "@/components/ProtectedView";
import TaskListView from "@/components/TaskListView";

export default function WaitingPage() {
  return (
    <ProtectedView view="waiting">
      <TaskListView view="waiting" />
    </ProtectedView>
  );
}
