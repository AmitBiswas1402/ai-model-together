"use client";

import { buildFullHtml } from "@/lib/build-html";
import { createCodeSandbox } from "@/lib/codesandbox";
import { extractHtmlContent } from "@/lib/html-utils";
import { Download, ExternalLink, Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type Props = {
  generatedCode: string;
  selectedScreenSize: string;
  setSelectedScreenSize: (size: string) => void;
};

export const SCREEN_SIZES = [
  { id: "web", icon: Monitor, label: "Desktop", width: "1280px" },
  { id: "tablet", icon: Tablet, label: "Tablet", width: "768px" },
  { id: "mobile", icon: Smartphone, label: "Mobile", width: "390px" },
] as const;

const WebPageTools = ({
  generatedCode,
  selectedScreenSize,
  setSelectedScreenSize,
}: Props) => {
  const [downloading, setDownloading] = useState(false);
  const [openingSandbox, setOpeningSandbox] = useState(false);

  const cleanCode = useMemo(
    () => extractHtmlContent(generatedCode),
    [generatedCode],
  );
  const fullHtml = useMemo(() => buildFullHtml(cleanCode), [cleanCode]);
  const currentSize = SCREEN_SIZES.find((s) => s.id === selectedScreenSize);
  const hasCode = cleanCode.length > 0;

  const downloadCode = async () => {
    if (!hasCode || downloading) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      zip.file("index.html", fullHtml);
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "website-project.zip";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Project downloaded successfully.");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download project.");
    } finally {
      setDownloading(false);
    }
  };

  const openInCodeSandbox = async () => {
    if (!hasCode || openingSandbox) return;
    setOpeningSandbox(true);
    try {
      const sandboxId = await createCodeSandbox({
        "index.html": { content: fullHtml },
      });

      window.open(`https://codesandbox.io/s/${sandboxId}`, "_blank");
      toast.success("Opened in CodeSandbox.");
    } catch (error) {
      console.error("Failed to open in CodeSandbox:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open in CodeSandbox.",
      );
    } finally {
      setOpeningSandbox(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
            {SCREEN_SIZES.map(({ id, icon: Icon, label, width }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setSelectedScreenSize(id)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      selectedScreenSize === id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {label} ({width})
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {currentSize && (
            <span className="hidden rounded-full border bg-muted/30 px-2.5 py-1 font-mono text-[11px] text-muted-foreground md:inline">
              {currentSize.width}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openInCodeSandbox}
            disabled={!hasCode || openingSandbox}
            className="h-8 gap-1.5 text-xs"
          >
            {openingSandbox ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ExternalLink className="size-3.5" />
            )}
            <span className="hidden sm:inline">Open Sandbox</span>
          </Button>

          <Button
            size="sm"
            onClick={downloadCode}
            disabled={!hasCode || downloading}
            className="h-8 gap-1.5 text-xs"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span className="hidden sm:inline">
              {downloading ? "Zipping..." : "Download"}
            </span>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WebPageTools;
