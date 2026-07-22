import type { CSSProperties } from "react";

export const FONT_STACKS: Record<string, string> = {
  system:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
  rounded: "'Trebuchet MS', Verdana, sans-serif",
};

export const CORNER_RADII: Record<string, string> = {
  sharp: "0px",
  rounded: "0.75rem",
  pill: "1.75rem",
};

export type TruckTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  cornerStyle: string;
};

export function themeCssVars(theme: TruckTheme): CSSProperties {
  return {
    ["--truck-primary" as string]: theme.primaryColor,
    ["--truck-secondary" as string]: theme.secondaryColor,
    ["--truck-accent" as string]: theme.accentColor,
    ["--truck-font" as string]: FONT_STACKS[theme.fontFamily] ?? FONT_STACKS.system,
    ["--truck-radius" as string]: CORNER_RADII[theme.cornerStyle] ?? CORNER_RADII.rounded,
  } as CSSProperties;
}
