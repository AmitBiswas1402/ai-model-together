import { SidebarTrigger } from "@/components/ui/sidebar"

const AppHeader = () => {
  return (
    <div className="flex items-center justify-between p-3 shadow">
      <SidebarTrigger />
    </div>
  )
}
export default AppHeader