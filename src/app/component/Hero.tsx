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

  const inputIsUrl = (() => {
    try {
      const trimmed = userInput.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        new URL(trimmed);
        return true;
      }
      if (/^[\w-]+(\.[\w-]+)+/.test(trimmed) && !trimmed.includes(" ")) {
        const withProto = `https://${trimmed}`;
        new URL(withProto);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      toast.error("Please upload a valid image file");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
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
      let prompt = userInput;

      if (inputIsUrl) {
        try {
          toast.info("Analyzing website...");
          const scrapeUrl = /^https?:\/\//i.test(userInput.trim())
            ? userInput.trim()
            : `https://${userInput.trim()}`;
          const scrapeResult = await axios.post("/api/scrape-url", {
            url: scrapeUrl,
          });
          const data = scrapeResult.data;
          let scrapedPrompt = `Recreate a website inspired by ${userInput.trim()}.\n\n`;
          scrapedPrompt += `Here is the extracted content from that website:\n`;
          if (data.title) scrapedPrompt += `- Page Title: ${data.title}\n`;
          if (data.metaDescription)
            scrapedPrompt += `- Description: ${data.metaDescription}\n`;
          if (data.navLinks?.length)
            scrapedPrompt += `- Navigation Items: ${data.navLinks.join(", ")}\n`;
          if (data.headings?.length)
            scrapedPrompt += `- Headings: ${data.headings.join(" | ")}\n`;
          if (data.paragraphs?.length)
            scrapedPrompt += `- Content Sections:\n${data.paragraphs.map((p: string) => `  • ${p}`).join("\n")}\n`;
          if (data.buttons?.length)
            scrapedPrompt += `- Buttons/CTAs: ${data.buttons.join(", ")}\n`;
          if (data.images?.length)
            scrapedPrompt += `- Image Descriptions: ${data.images.join(", ")}\n`;
          if (data.sections?.length)
            scrapedPrompt += `- Page Sections/Landmarks: ${data.sections.join(", ")}\n`;
          scrapedPrompt += `\nGenerate a complete, modern, responsive HTML website (body content only) that recreates this design using Tailwind CSS and Flowbite components. Match the layout, sections, and content structure as closely as possible while making it visually stunning.`;
          prompt = scrapedPrompt;
        } catch (error) {
          console.error("Failed to scrape URL:", error);
          toast.error(
            "Could not analyze the website, generating from URL text...",
          );
          prompt = `Recreate a website similar to ${userInput}. Generate a complete, modern, responsive HTML website (body content only) using Tailwind CSS and Flowbite components.`;
        }
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await axios.post("/api/images/upload", formData);
        imageUrl = uploadRes.data.url;
      }

      const messages = [
        {
          role: "user",
          content: prompt,
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
              placeholder="Describe your page design or paste a URL to clone..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (userInput.trim() && !loading) {
                    CreateNewProject();
                  }
                }
              }}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (items) {
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.startsWith("image/")) {
                      e.preventDefault();
                      const file = items[i].getAsFile();
                      if (file) handleImageFile(file);
                      break;
                    }
                  }
                }
              }}
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
            <div className="flex items-center">
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
            </div>

            <p className="text-xs text-muted-foreground">
              Press Enter. Press Shift + Enter for next line.
            </p>

            <Button
              size="icon-lg"
              disabled={!userInput.trim() || loading}
              className="rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.04] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={CreateNewProject}
            >
              {loading ? <Loader2Icon className="animate-spin" /> : <ArrowUp />}
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
