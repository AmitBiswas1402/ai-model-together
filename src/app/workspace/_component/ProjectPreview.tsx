"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { extractHtmlContent } from "@/lib/html-utils";
import { buildFullHtml } from "@/lib/build-html";

const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 800;

type ProjectPreviewProps = {
  designCode: string | null;
};

const ProjectPreview = ({ designCode }: ProjectPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  const html = useMemo(() => {
    const content = extractHtmlContent(designCode);
    if (!content) return null;
    return buildFullHtml(content);
  }, [designCode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      setScale(el.offsetWidth / PREVIEW_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!html) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted to-muted/60">
        <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-white"
    >
      <iframe
        srcDoc={html}
        title="Project preview"
        sandbox="allow-scripts"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          transform: `scale(${scale})`,
        }}
        tabIndex={-1}
      />
    </div>
  );
};

export default ProjectPreview;
