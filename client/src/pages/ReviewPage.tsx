import ProtectedView from "@/components/ProtectedView";
import HetiAttekintes from "@/components/HetiAttekintes";

export default function ReviewPage() {
  return (
    <ProtectedView view="review">
      <HetiAttekintes />
    </ProtectedView>
  );
}
