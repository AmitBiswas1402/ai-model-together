import { OnSaveContext } from "@/context/OnSaveContext";
import { getCleanDesignHtml } from "@/lib/design-html";
import { extractHtmlContent } from "@/lib/html-utils";
import { Code2, Eye, FolderOpen, Loader2 } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import WebPageTools from "./WebPageTools";
import {
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackProvider,
  SandpackTheme,
} from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";
import { useIsMobile } from "@/lib/use-mobile";
import ElementSettingSection from "./ElementSettingSection";
import ImageSettingSection from "./ImageSettingSection";

type Props = { generatedCode: string };

const IFRAME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>AI Website Builder</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"><\/script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css"/>
<script src="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js"><\/script>
<link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css"/>
<script src="https://unpkg.com/@popperjs/core@2"><\/script>
<script src="https://unpkg.com/tippy.js@6"><\/script>
<style>body{margin:0;overflow-x:hidden}*{transition:outline 0.15s ease}</style>
</head>
<body id="root"></body>
</html>`;

const DEFAULT_BODY = `<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:system-ui,sans-serif;"><div style="text-align:center;padding:48px 32px;border:1px dashed #cbd5e1;border-radius:20px;background:#fff;"><p style="color:#64748b;font-size:14px;margin:0;">Your generated website will appear here.</p><p style="color:#94a3b8;font-size:12px;margin-top:8px;">Describe a design in the chat to get started.</p></div></main>`;

const normalizeCode = (code: string) => extractHtmlContent(code);

const buildSandpackFiles = (code: string) => {
  const body = normalizeCode(code) || DEFAULT_BODY;
  const files: Record<string, string> = {
    "/index.html": `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>AI Website Builder</title><script src="https://cdn.tailwindcss.com"><\/script><link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet"/><script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"><\/script></head><body id="root">${body}</body></html>`,
  };
  if (
    body.includes("class=") ||
    body.includes("style=") ||
    body.includes("<style")
  ) {
    files["/styles.css"] =
      ":root{color-scheme:light}*{box-sizing:border-box}body{margin:0;min-height:100vh}img{max-width:100%;display:block}a{color:inherit;text-decoration:none}";
  }
  return files;
};

type PanelView = "preview" | "code";

const playgroundTheme: SandpackTheme = {
  ...nightOwl,
  colors: {
    ...nightOwl.colors,
    surface1: "#0d1117",
    surface2: "#161b22",
    surface3: "#1c2333",
    clickable: "#8b949e",
    base: "#e6edf3",
    disabled: "#484f58",
    hover: "#1f6feb22",
    accent: "#2563eb",
    error: "#f85149",
    errorSurface: "#f8514922",
  },
};

const CodeSandboxWorkSpace = ({ generatedCode }: Props) => {
  const isMobile = useIsMobile();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const latestDesignRef = useRef("");
  const handlersAttachedRef = useRef(false);
  const hoverElRef = useRef<HTMLElement | null>(null);
  const selectedElRef = useRef<HTMLElement | null>(null);

  const [selectedScreenSize, setSelectedScreenSize] = useState("web");
  const [activeView, setActiveView] = useState<PanelView>("preview");
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null,
  );
  const [iframeLoading, setIframeLoading] = useState(true);

  const saveContext = useContext(OnSaveContext);

  const sandboxFiles = buildSandpackFiles(generatedCode);
  const visibleFiles = Object.keys(sandboxFiles);

  const getLiveDesignHtml = useCallback(() => {
    const root = iframeRef.current?.contentDocument?.getElementById("root");
    if (!root) return latestDesignRef.current || null;
    const html = getCleanDesignHtml(root);
    latestDesignRef.current = html;
    return html;
  }, []);

  const syncDesignCache = useCallback(() => {
    const html = getLiveDesignHtml();
    if (html) latestDesignRef.current = html;
  }, [getLiveDesignHtml]);

  const clearSelection = useCallback(() => {
    const selected = selectedElRef.current;
    if (selected) {
      selected.style.outline = "";
      selected.removeAttribute("contenteditable");
    }
    selectedElRef.current = null;
    setSelectedElement(null);
    syncDesignCache();
  }, [syncDesignCache]);

  const attachSelectionHandlers = useCallback(
    (doc: Document) => {
      if (handlersAttachedRef.current) return;
      handlersAttachedRef.current = true;

      const root = doc.getElementById("root");
      if (!root) return;

      const handleMouseOver = (e: MouseEvent) => {
        if (selectedElRef.current) return;
        const target = e.target as HTMLElement;
        if (!root.contains(target) || target === root || target === doc.body)
          return;

        if (hoverElRef.current && hoverElRef.current !== target) {
          hoverElRef.current.style.outline = "";
          hoverElRef.current.style.cursor = "";
        }
        hoverElRef.current = target;
        target.style.outline = "2px dotted blue";
        target.style.cursor = "pointer";
      };

      const handleMouseOut = (e: MouseEvent) => {
        if (selectedElRef.current) return;
        const related = e.relatedTarget as Node | null;
        if (
          hoverElRef.current &&
          (!related || !hoverElRef.current.contains(related))
        ) {
          hoverElRef.current.style.outline = "";
          hoverElRef.current.style.cursor = "";
          hoverElRef.current = null;
        }
      };

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!root.contains(target) || target === root || target === doc.body) {
          clearSelection();
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (selectedElRef.current && selectedElRef.current !== target) {
          selectedElRef.current.style.outline = "";
          selectedElRef.current.removeAttribute("contenteditable");
        }

        selectedElRef.current = target;
        target.style.outline = "2px solid red";
        target.setAttribute("contenteditable", "true");
        target.focus();
        setSelectedElement(target);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") clearSelection();
      };

      doc.addEventListener("mouseover", handleMouseOver);
      doc.addEventListener("mouseout", handleMouseOut);
      doc.addEventListener("click", handleClick);
      doc.addEventListener("keydown", handleKeyDown);
    },
    [clearSelection],
  );

  const updateIframeContent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    let root = doc.getElementById("root");
    if (!root) {
      doc.open();
      doc.write(IFRAME_HTML);
      doc.close();
      root = doc.getElementById("root");
      handlersAttachedRef.current = false;
    }

    if (root) {
      root.innerHTML = normalizeCode(generatedCode) || DEFAULT_BODY;
      latestDesignRef.current = getCleanDesignHtml(root);
      setIframeLoading(false);
      attachSelectionHandlers(doc);
    }
  }, [generatedCode, attachSelectionHandlers]);

  useEffect(() => {
    updateIframeContent();
  }, [updateIframeContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => updateIframeContent();
    iframe.addEventListener("load", onLoad);
    const fallback = setTimeout(updateIframeContent, 500);

    return () => {
      iframe.removeEventListener("load", onLoad);
      clearTimeout(fallback);
    };
  }, [updateIframeContent]);

  useEffect(() => {
    saveContext?.setDesignHtmlGetter(getLiveDesignHtml);
    return () => saveContext?.setDesignHtmlGetter(null);
  }, [saveContext, getLiveDesignHtml]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    const root = doc?.getElementById("root");
    if (!root) return;

    syncDesignCache();

    const observer = new MutationObserver(() => {
      syncDesignCache();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: ["class", "style", "src", "alt", "href"],
    });

    return () => observer.disconnect();
  }, [generatedCode, syncDesignCache]);

  const refreshPreview = () => {
    handlersAttachedRef.current = false;
    clearSelection();
    updateIframeContent();
  };

  const previewSizeClass =
    selectedScreenSize === "web"
      ? "w-full"
      : selectedScreenSize === "tablet"
        ? "w-[768px] max-w-full"
        : "w-[390px] max-w-full";

  const viewBtn = (view: PanelView, Icon: typeof Eye, label: string) => (
    <button
      type="button"
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        activeView === view
          ? "border-primary/25 bg-primary/10 text-primary shadow-sm"
          : "border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex h-full min-h-0 w-full gap-0 p-3">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <WebPageTools
          generatedCode={generatedCode}
          selectedScreenSize={selectedScreenSize}
          setSelectedScreenSize={setSelectedScreenSize}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
            {viewBtn("preview", Eye, "Preview")}
            {viewBtn("code", Code2, "Code")}
            <div className="ml-auto hidden items-center gap-2 font-mono text-[10px] text-muted-foreground md:flex">
              {generatedCode && (
                <span className="rounded-md border bg-muted/40 px-2 py-0.5">
                  {generatedCode.length.toLocaleString()} chars
                </span>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {activeView === "preview" && (
              <div className="relative flex flex-1 flex-col overflow-hidden bg-muted/20">
                <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
                  <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-2.5 py-1">
                    <span className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                      localhost:3000
                    </span>
                    <button
                      type="button"
                      onClick={refreshPreview}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      title="Refresh"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M8 16H3v5" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4">
                  <div
                    className={`${previewSizeClass} relative min-h-[400px] overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300`}
                    style={{ height: "100%", maxHeight: "100%" }}
                  >
                    {iframeLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="size-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Loading preview...
                          </span>
                        </div>
                      </div>
                    )}
                    <iframe
                      ref={iframeRef}
                      title="Website preview"
                      className="h-full min-h-[400px] w-full border-0"
                      sandbox="allow-same-origin allow-scripts allow-pointer-lock allow-forms"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-center border-t py-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    Click any element to customize
                  </span>
                </div>
              </div>
            )}

            {activeView === "code" && (
              <SandpackProvider
                key={generatedCode.slice(0, 120)}
                template="static"
                files={sandboxFiles}
                theme={playgroundTheme}
                options={{
                  activeFile: "/index.html",
                  visibleFiles,
                  recompileMode: "delayed",
                  recompileDelay: 300,
                }}
                customSetup={{ entry: "/index.html" }}
              >
                <div className="flex flex-1 overflow-hidden">
                  {!isMobile && (
                    <div className="flex w-48 shrink-0 flex-col border-r bg-[#0d1117]">
                      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2.5">
                        <FolderOpen className="size-3.5 text-primary/70" />
                        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                          Explorer
                        </span>
                      </div>
                      <div className="flex-1 overflow-auto p-2">
                        <SandpackFileExplorer
                          autoHiddenFiles={false}
                          initialCollapsedFolder={[]}
                        />
                      </div>
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <SandpackCodeEditor
                      showTabs={false}
                      showLineNumbers
                      showInlineErrors
                      wrapContent
                      className="h-full w-full"
                      style={{ height: "100%", fontSize: "13px" }}
                    />
                  </div>
                </div>
              </SandpackProvider>
            )}
          </div>
        </div>
      </div>

      {selectedElement?.tagName === "IMG" ? (
        <ImageSettingSection
          selectedEl={selectedElement as HTMLImageElement}
          clearSelection={clearSelection}
        />
      ) : selectedElement ? (
        <ElementSettingSection
          selectedEl={selectedElement}
          clearSelection={clearSelection}
        />
      ) : null}
    </div>
  );
};
export default CodeSandboxWorkSpace;
