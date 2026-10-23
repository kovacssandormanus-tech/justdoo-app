import ProtectedView from "@/components/ProtectedView";
import ProjektekNezet from "@/components/ProjektekNezet";

export default function ProjectsPage() {
  return (
    <ProtectedView view="projects">
      <ProjektekNezet />
    </ProtectedView>
  );
}
