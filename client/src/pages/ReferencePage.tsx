import ProtectedView from "@/components/ProtectedView";
import TaskListView from "@/components/TaskListView";

export default function ReferencePage() {
  return (
    <ProtectedView view="reference">
      <TaskListView view="reference" />
    </ProtectedView>
  );
}
