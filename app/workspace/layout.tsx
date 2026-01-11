import { SidebarProvider } from "@/components/ui/sidebar";
import AppHeader from "./_components/AppHeader";

const WorkspaceLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <SidebarProvider>
        

      <div className="w-full">
        <AppHeader />
        {children}
      </div>
    </SidebarProvider>
  );
};
export default WorkspaceLayout;
