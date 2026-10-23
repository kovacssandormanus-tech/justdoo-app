import ProtectedView from "@/components/ProtectedView";
import GyujtoPanel from "@/components/GyujtoPanel";

export default function InboxPage() {
  return (
    <ProtectedView view="inbox">
      <GyujtoPanel />
    </ProtectedView>
  );
}
