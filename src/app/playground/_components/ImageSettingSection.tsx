"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crop, Expand, ImageIcon, ImageMinus, Loader2, Sparkles, Upload, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  selectedEl: HTMLImageElement;
  clearSelection: () => void;
};

const transformOptions = [
  { label: "Smart Crop", transformation: "fo-auto", icon: Crop },
  { label: "Upscale", transformation: "e-upscale", icon: ZoomIn },
  { label: "BG Remove", transformation: "e-bgremove", icon: ImageMinus },
  { label: "Resize", transformation: "resize", icon: Expand },
] as const;

function stripTransformations(url: string) {
  return url.split("?")[0];
}

function getActiveTransformations(url: string) {
  const query = url.split("?")[1] ?? "";
  const match = query.match(/(?:^|&)tr=([^&]*)/);
  if (!match?.[1]) return [];
  return match[1].split(",").filter(Boolean);
}

function buildTransformUrl(baseUrl: string, transforms: string[]) {
  const base = stripTransformations(baseUrl);
  const filtered = transforms.filter((t) => t && t !== "resize");
  if (!filtered.length) return base;
  return `${base}?tr=${filtered.join(",")}`;
}

const PANEL_CLASS =
  "flex h-full w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-card p-4 shadow-sm lg:w-80";

const ImageSettingSection = ({ selectedEl, clearSelection }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(200);
  const [borderRadius, setBorderRadius] = useState("0px");
  const [preview, setPreview] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [activeTransforms, setActiveTransforms] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAltText(selectedEl.alt || "");
    setPrompt(selectedEl.alt || "");
    setWidth(selectedEl.width || selectedEl.naturalWidth || 300);
    setHeight(selectedEl.height || selectedEl.naturalHeight || 200);
    setBorderRadius(selectedEl.style.borderRadius || "0px");
    setPreview(selectedEl.src || "");
    setBaseUrl(stripTransformations(selectedEl.src || ""));
    setActiveTransforms(getActiveTransformations(selectedEl.src || ""));
    setSelectedFile(null);
  }, [selectedEl]);

  const applyToElement = (url: string) => {
    selectedEl.src = url;
    selectedEl.alt = altText;
    if (borderRadius) {
      selectedEl.style.borderRadius = borderRadius;
    }
    setPreview(url);
  };

  const handleAltChange = (value: string) => {
    setAltText(value);
    selectedEl.alt = value;
  };

  const handleBorderRadiusChange = (value: string) => {
    setBorderRadius(value);
    selectedEl.style.borderRadius = value;
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadFile = async (file: File, fallbackDataUrl?: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setBaseUrl(stripTransformations(data.url));
      setActiveTransforms([]);
      applyToElement(data.url);
      setSelectedFile(null);

      if (data.local) {
        toast.success(data.message || "Image applied locally.");
      } else {
        toast.success(
          data.provider === "imagekit"
            ? "Image uploaded to ImageKit."
            : "Image uploaded successfully.",
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);

      if (fallbackDataUrl) {
        setBaseUrl(fallbackDataUrl);
        setActiveTransforms([]);
        applyToElement(fallbackDataUrl);
        toast.success("Image applied locally.");
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image.",
        );
      }
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setSelectedFile(file);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreview(dataUrl);
      setBaseUrl(dataUrl);
      setActiveTransforms([]);
      await uploadFile(file, dataUrl);
    } catch {
      toast.error("Failed to read image file.");
      setLoading(false);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }

    const dataUrl = preview.startsWith("data:") ? preview : undefined;
    await uploadFile(selectedFile, dataUrl);
  };

  const generateAiImage = async () => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt to generate an image.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setBaseUrl(stripTransformations(data.url));
      setActiveTransforms([]);
      applyToElement(data.url);
      handleAltChange(prompt.trim());

      if (data.provider === "pollinations") {
        toast.success(data.message || "AI image generated (fallback).");
      } else {
        toast.success("AI image generated.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate image.",
      );
      setLoading(false);
    }
  };

  const toggleTransform = (transformation: string) => {
    if (transformation === "resize") {
      setActiveTransforms((prev) =>
        prev.includes("resize")
          ? prev.filter((t) => t !== "resize")
          : [...prev.filter((t) => t !== "resize"), "resize"],
      );
      return;
    }

    const next = activeTransforms.includes(transformation)
      ? activeTransforms.filter((t) => t !== transformation)
      : [...activeTransforms.filter((t) => t !== "resize"), transformation];

    setActiveTransforms(next);
    const url = buildTransformUrl(baseUrl, next);
    applyToElement(url);
  };

  const applyResize = () => {
    const sizeTransform = `w-${width},h-${height}`;
    const otherTransforms = activeTransforms.filter((t) => t !== "resize");
    const trParts = [
      ...otherTransforms.filter((t) => t !== "resize"),
      sizeTransform,
    ];
    const url = buildTransformUrl(baseUrl, trParts);
    applyToElement(url);
    selectedEl.width = width;
    selectedEl.height = height;
    toast.success("Resize applied.");
  };

  return (
    <TooltipProvider>
      <div className={PANEL_CLASS}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground"
            title="Click to deselect"
          >
            Image Settings
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearSelection}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

      <div
        className="flex cursor-pointer items-center justify-center rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter") fileInputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <img
            src={preview}
            alt={altText || "Preview"}
            className="max-h-36 max-w-full rounded-md object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              toast.error("Failed to load image preview.");
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <ImageIcon className="size-8 opacity-40" />
            <span className="text-xs">Click to choose an image</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        variant="outline"
        className="h-8 w-full gap-1.5 text-xs"
        onClick={uploadImage}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        {selectedFile ? "Re-upload Image" : "Choose Image"}
      </Button>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Alt text</label>
        <Input
          value={altText}
          onChange={(e) => handleAltChange(e.target.value)}
          placeholder="Describe this image"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">AI prompt</label>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A modern hero banner with blue gradient"
          className="h-8 text-xs"
        />
      </div>

      <Button
        type="button"
        className="h-8 w-full gap-1.5 text-xs"
        onClick={generateAiImage}
        disabled={loading || !prompt.trim()}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        Generate AI Image
      </Button>

      <div>
        <label className="mb-1.5 block text-xs text-muted-foreground">
          AI Transform
        </label>
        <div className="flex flex-wrap gap-1.5">
          {transformOptions.map(({ label, transformation, icon: Icon }) => {
            const isActive =
              transformation === "resize"
                ? activeTransforms.includes("resize")
                : activeTransforms.includes(transformation);

            return (
              <Tooltip key={transformation}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="icon-sm"
                    className="size-8"
                    onClick={() => toggleTransform(transformation)}
                    disabled={!baseUrl || loading}
                  >
                    <Icon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {activeTransforms.includes("resize") && (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Width</label>
              <Input
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Height</label>
              <Input
                type="number"
                min={1}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={applyResize}
            disabled={loading}
          >
            Apply Resize
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Border radius</label>
        <Input
          type="text"
          value={borderRadius}
          onChange={(e) => handleBorderRadiusChange(e.target.value)}
          placeholder="e.g. 8px or 50%"
          className="h-8 text-xs"
        />
      </div>
      </div>
    </TooltipProvider>
  );
};
export default ImageSettingSection;
