"use client";

import { useCallback, useEffect, useState } from "react";
import ProjectCard, { ProjectData } from "./ProjectCard";
import axios from "axios";
import ScrollReveal from "./ScrollReveal";
import Link from "next/link";
import ProjectCardSkeleton from "./ProjectCardSkeleton";

const ProjectsSection = () => {
  const [projectList, setProjectList] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const GetProjectList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await axios.get<ProjectData[]>("/api/get-all-projects/");
      setProjectList(result.data);
    } catch (error) {
      console.error("Error fetching project list:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    GetProjectList();
  }, [GetProjectList]);

  return (
    <section
      id="projects-section"
      className="relative -mt-6 snap-start rounded-t-[2rem] border-t bg-muted/40 px-4 py-8 pb-20 shadow-[0_-16px_48px_-20px_rgba(0,0,0,0.1)]"
    >
      <div className="mx-auto max-w-350">
        <ScrollReveal>
          <div className="mb-5 flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">
              AI Website Creator
            </Link>
            <span className="rounded-full bg-background px-3 py-1 text-sm font-medium shadow-sm">
              Your projects
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <ScrollReveal key={index} index={index}>
                  <ProjectCardSkeleton />
                </ScrollReveal>
              ))
            ) : projectList.length === 0 ? (
              <p className="col-span-full py-8 text-sm text-muted-foreground">
                No projects yet. Describe a design above to get started.
              </p>
            ) : (
              projectList.map((project, index) => (
                <ScrollReveal
                  key={`${project.projectId}-${project.frameId}`}
                  index={index}
                >
                  <ProjectCard
                    project={project}
                    onRefresh={GetProjectList}
                  />
                </ScrollReveal>
              ))
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
export default ProjectsSection;
