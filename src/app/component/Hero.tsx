"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { ArrowUp, ChevronDown, ImagePlus, Loader2Icon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const genRandom = () => String(Math.floor(Math.random() * 10000));

const Hero = () => {
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const router = useRouter();

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      toast.error("Please upload a valid image file");
    }
    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleScrollDown = () => {
    const projectsSection = document.getElementById("projects-section");
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollBy({ top: window.innerHeight * 0.45, behavior: "smooth" });
  };

  const CreateNewProject = async () => {
    setLoading(true);
    const projectId = uuidv4();
    const frameId = genRandom();

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await axios.post("/api/images/upload", formData);
        imageUrl = uploadRes.data.url;
      }

      const messages = [
        {
          role: "user",
          content: userInput,
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      ];

      await axios.post("/api/projects", {
        projectId,
        frameId,
        messages,
      });
      toast.success("Project created successfully!");
      router.push(`/playground/${projectId}?frameId=${frameId}`);
    } catch (error) {
      toast.error("Failed to create project.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-[calc(100vh-5.5rem)] snap-start flex-col items-center justify-center px-4 pb-2">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          What should we Design?
        </h1>

        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          Create stunning websites in minutes with our AI-powered design tool.
        </p>
      </div>

      {/* Prompt Box */}
      <div className="relative mt-10 w-full max-w-4xl">
        <div
          className="pointer-events-none absolute inset-0 rounded-[32px] opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%)",
            filter: "blur(12px)",
          }}
        />

        <div className="relative rounded-[28px] border border-border/60 bg-card/60 p-5 shadow-xl backdrop-blur-xl">
          {imagePreview && (
            <div className="relative mb-4 overflow-hidden rounded-xl border border-border/40 bg-accent/10">
              <img
                src={imagePreview}
                alt="Preview"
                className="mx-auto max-h-60 w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 cursor-pointer rounded-full border border-border/45 bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              placeholder="Describe your page design..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="h-24 w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 md:text-[15px]"
            />
            {userInput && (
              <button
                type="button"
                onClick={() => setUserInput("")}
                aria-label="Clear prompt"
                className="absolute right-1 top-1 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
            <input
              type="file"
              accept="image/*"
              id="image-upload"
              onChange={handleImageUpload}
              className="hidden"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById("image-upload")?.click()}
              className="h-9 w-9 rounded-xl text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
            >
              <ImagePlus className="h-5 w-5" />
            </Button>

            <Button
              size="icon-lg"
              disabled={!userInput.trim() || loading}
              className="rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.04] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={CreateNewProject}
            >
              {loading ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <ArrowUp />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-3">
        <div className="pointer-events-none h-12 w-full bg-linear-to-t from-muted/50 to-transparent" />
        <button
          type="button"
          onClick={handleScrollDown}
          aria-label="Scroll down"
          className="-mt-1 cursor-pointer rounded-full border border-border/50 bg-background/80 p-2 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/80"
        >
          <ChevronDown className="h-6 w-6 animate-scroll-hint" />
        </button>
      </div>
    </section>
  );
};

export default Hero;
