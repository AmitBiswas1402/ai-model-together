"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlignCenter, AlignLeft, AlignRight, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  selectedEl: HTMLElement;
  clearSelection: () => void;
};

const parseClasses = (className: string) =>
  className.split(" ").filter((c) => c.trim() !== "");

const PANEL_CLASS =
  "flex h-full w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-card p-4 shadow-sm lg:w-80";

const ElementSettingSection = ({ selectedEl, clearSelection }: Props) => {
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState("");
  const [fontSize, setFontSize] = useState("16px");
  const [color, setColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [borderRadius, setBorderRadius] = useState("");
  const [padding, setPadding] = useState("");
  const [margin, setMargin] = useState("");
  const [align, setAlign] = useState("left");

  const applyStyle = (property: string, value: string) => {
    selectedEl.style.setProperty(property, value);
  };

  useEffect(() => {
    const style = selectedEl.style;

    setClasses(parseClasses(selectedEl.className));
    setFontSize(style.fontSize || "16px");
    setColor(style.color || "#000000");
    setBackgroundColor(style.backgroundColor || "#ffffff");
    setBorderRadius(style.borderRadius || "");
    setPadding(style.padding || "");
    setMargin(style.margin || "");
    setAlign(style.textAlign || "left");

    const observer = new MutationObserver(() => {
      setClasses(parseClasses(selectedEl.className));
    });

    observer.observe(selectedEl, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      observer.disconnect();
    };
  }, [selectedEl]);

  const removeClass = (cls: string) => {
    const updated = classes.filter((c) => c !== cls);
    setClasses(updated);
    selectedEl.className = updated.join(" ");
  };

  const addClass = () => {
    const trimmed = newClass.trim();
    if (!trimmed || classes.includes(trimmed)) return;

    const updated = [...classes, trimmed];
    setClasses(updated);
    selectedEl.className = updated.join(" ");
    setNewClass("");
  };

  return (
    <div className={PANEL_CLASS}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={clearSelection}
          className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground"
          title="Click to deselect"
        >
          Element Settings
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

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Tag</label>
        <Input value={selectedEl.tagName.toLowerCase()} disabled />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Font Size</label>
          <Select
            value={fontSize}
            onValueChange={(value) => {
              if (!value) return;
              setFontSize(value);
              applyStyle("font-size", value);
            }}
          >
            <SelectTrigger className="mt-1 h-8 w-full text-xs">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 53 }, (_, index) => {
                const size = `${index + 12}px`;
                return (
                  <SelectItem key={size} value={size} className="text-xs">
                    {index + 12} px
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Color</label>
          <input
            type="color"
            className="mt-1 h-9 w-9 cursor-pointer rounded-lg border bg-transparent"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              applyStyle("color", e.target.value);
            }}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Alignment
        </label>
        <div className="inline-flex w-full rounded-lg border bg-muted/40 p-0.5">
          {(
            [
              { value: "left", icon: AlignLeft },
              { value: "center", icon: AlignCenter },
              { value: "right", icon: AlignRight },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setAlign(value);
                applyStyle("text-align", value);
              }}
              className={`flex flex-1 items-center justify-center rounded-md p-1.5 transition-colors ${
                align === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>          

      <div className="flex items-center gap-3">
        <div>
          <label className="block text-xs text-muted-foreground">
            Background
          </label>
          <input
            type="color"
            className="mt-1 h-9 w-9 cursor-pointer rounded-lg border bg-transparent"
            value={backgroundColor}
            onChange={(e) => {
              setBackgroundColor(e.target.value);
              applyStyle("background-color", e.target.value);
            }}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Border Radius</label>
          <Input
            type="text"
            placeholder="e.g. 8px"
            value={borderRadius}
            onChange={(e) => {
              setBorderRadius(e.target.value);
              applyStyle("border-radius", e.target.value);
            }}
            className="mt-1 h-8 text-xs"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Padding</label>
        <Input
          type="text"
          placeholder="e.g. 10px 15px"
          value={padding}
          onChange={(e) => {
            setPadding(e.target.value);
            applyStyle("padding", e.target.value);
          }}
          className="mt-1 h-8 text-xs"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Margin</label>
        <Input
          type="text"
          placeholder="e.g. 10px 15px"
          value={margin}
          onChange={(e) => {
            setMargin(e.target.value);
            applyStyle("margin", e.target.value);
          }}
          className="mt-1 h-8 text-xs"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Classes
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <span
                key={cls}
                className="flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {cls}
                <button
                  type="button"
                  onClick={() => removeClass(cls)}
                  className="ml-0.5 text-destructive hover:opacity-80"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground/60">
              No classes
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-1.5">
          <Input
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addClass();
            }}
            placeholder="Add class..."
            className="h-8 text-xs"
          />
          <Button type="button" onClick={addClass} size="sm" className="h-8 px-3 text-xs">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ElementSettingSection;
