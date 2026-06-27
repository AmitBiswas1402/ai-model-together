import axios from "axios";
import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import ProjectPreview from "./ProjectPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export type ProjectData = {
  projectId: string;
  frameId: string;
  designCode: string | null;
  chats: { chatMessage?: unknown }[];
};

type ProjectCardProps = {
  project: ProjectData;
  onRefresh: () => void;
};

function getProjectTitle(project: ProjectData): string {
  const chatMessage = project?.chats?.[0]?.chatMessage;
  if (Array.isArray(chatMessage) && chatMessage[0]?.content) {
    return chatMessage[0].content as string;
  }
  if (typeof chatMessage === "string") {
    return chatMessage;
  }
  return "Untitled Project";
}

const ProjectCard = ({ project, onRefresh }: ProjectCardProps) => {
  const title = getProjectTitle(project);
  const [openDialog, setOpenDialog] = useState(false);
  const [newName, setNewName] = useState(title);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      await axios.post("/api/rename-project", {
        projectId: project.projectId,
        newName: newName.trim(),
      });
      setOpenDialog(false);
      onRefresh();
      toast.success("Project renamed successfully");
    } catch (error) {
      console.error("Rename failed:", error);
      toast.error("Failed to rename project.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.post("/api/delete-project", {
        projectId: project.projectId,
      });
      setOpenDeleteDialog(false);
      onRefresh();
      toast.success("Project deleted.");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete project.");
    }
  };

  return (
    <div className="group relative w-full">
      <Link
        href={`/playground/${project.projectId}?frameId=${project.frameId}`}
        className="block"
      >
        <div className="aspect-video overflow-hidden rounded-2xl bg-muted transition duration-300 ease-out group-hover:scale-[1.02] group-hover:opacity-95">
          <ProjectPreview designCode={project.designCode} />
        </div>
        <p className="mt-2 line-clamp-1 text-base font-semibold leading-snug transition-colors duration-200 group-hover:text-foreground/80">
          {title}
        </p>
      </Link>

      <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="icon-sm"
              className="h-7 w-7 rounded-full bg-background/90 shadow-sm backdrop-blur-sm"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-40 p-2"
            onClick={(e) => e.preventDefault()}
          >
            <button
              className="flex w-full items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-muted"
              onClick={(e) => {
                e.preventDefault();
                setOpenDialog(true);
              }}
            >
              <Edit3 className="h-4 w-4" />
              Rename
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              onClick={(e) => {
                e.preventDefault();
                setOpenDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Project</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-md border p-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default ProjectCard;
