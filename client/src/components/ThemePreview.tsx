import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Theme } from "@/contexts/ThemeContext";

interface ThemePreviewProps {
  theme: Theme;
  themeInfo: {
    name: string;
    description: string;
    preview: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}

export function ThemePreview({
  theme,
  themeInfo,
  isSelected,
  isCurrent,
  onSelect,
}: ThemePreviewProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg p-5 border border-border cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary ring-offset-2",
        "relative"
      )}
      onClick={onSelect}
    >
      {isCurrent && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
            <Check className="w-3 h-3" />
            Current
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg leading-tight">
          {themeInfo.name}
        </h3>

        {/* Color Preview */}
        <div className="flex gap-1 h-12 rounded-lg overflow-hidden border">
          <div
            className="flex-1"
            style={{ backgroundColor: themeInfo.preview.primary }}
            title="Primary"
          />
          <div
            className="flex-1"
            style={{ backgroundColor: themeInfo.preview.secondary }}
            title="Secondary"
          />
          <div
            className="flex-1"
            style={{ backgroundColor: themeInfo.preview.accent }}
            title="Accent"
          />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {themeInfo.description}
        </p>
      </div>
    </div>
  );
}
