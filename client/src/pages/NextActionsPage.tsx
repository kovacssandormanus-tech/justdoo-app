import ProtectedView from "@/components/ProtectedView";
import MitCsinaljakPanel from "@/components/MitCsinaljakPanel";
import TaskListView from "@/components/TaskListView";

export default function NextActionsPage() {
  return (
    <ProtectedView view="next">
      <MitCsinaljakPanel />
      <TaskListView view="next" />
    </ProtectedView>
  );
}
