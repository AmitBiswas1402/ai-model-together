import Hero from "../component/Hero"
import ProjectsSection from "./_component/ProjectsSection"

const Workspace = () => {
  return (
    <div className="snap-y snap-proximity">
      <Hero />
      <ProjectsSection />            
    </div>
  )
}
export default Workspace