import { AppSidebarShell } from "@/components/app-sidebar-shell";
import { FlyDashboard } from "@/components/fly-dashboard";

export default function FlyPage() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebarShell />
      <FlyDashboard />
    </div>
  );
}
