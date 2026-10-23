import ProtectedView from "@/components/ProtectedView";
import TaskListView from "@/components/TaskListView";

export default function Next10DaysPage() {
  return (
    <ProtectedView view="next10days">
      <TaskListView view="next10days" />
    </ProtectedView>
  );
}
