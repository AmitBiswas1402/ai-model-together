"use client";

import { createContext } from "react";

export type DesignHtmlGetter = () => string | null;

export interface OnSaveContextType {
  onSaveDate: Date | null;
  setOnSaveDate: (date: Date | null) => void;
  setDesignHtmlGetter: (getter: DesignHtmlGetter | null) => void;
  getDesignHtml: () => string | null;
}

export const OnSaveContext = createContext<OnSaveContextType | null>(null);
