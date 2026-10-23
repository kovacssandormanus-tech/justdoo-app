import ProtectedView from "@/components/ProtectedView";
import TaskListView from "@/components/TaskListView";

export default function SomedayPage() {
  return (
    <ProtectedView view="someday">
      <TaskListView view="someday" />
    </ProtectedView>
  );
}
