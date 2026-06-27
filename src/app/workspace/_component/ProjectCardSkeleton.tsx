import { Skeleton } from "@/components/ui/skeleton";

const ProjectCardSkeleton = () => {
  return (
    <div className="w-full">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
    </div>
  );
};

export default ProjectCardSkeleton;
