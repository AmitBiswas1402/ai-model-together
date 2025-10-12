import { SidebarTrigger } from "@/components/ui/sidebar"

const AppHeader = () => {
  return (
    <div className="p-3 w-full shadow flex justify-between items-center">
        <SidebarTrigger />
    </div>
  )
}
export default AppHeader