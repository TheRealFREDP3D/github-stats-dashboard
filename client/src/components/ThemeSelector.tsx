import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemePreview } from "./ThemePreview";
import type { Theme } from "@/contexts/ThemeContext";

interface ThemeInfo {
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themes: Record<Theme, ThemeInfo> = {
  light: {
    name: "GitHub Light",
    description: "Clean, professional GitHub-inspired light theme",
    preview: {
      primary: "#0969da",
      secondary: "#f6f8fa",
      accent: "#1a7f37",
    },
  },
  dark: {
    name: "GitHub Dark",
    description: "Modern dark theme with GitHub's color palette",
    preview: {
      primary: "#0969da",
      secondary: "#0d1117",
      accent: "#1a7f37",
    },
  },
  forest: {
    name: "Forest Green",
    description: "Calming nature-inspired theme with deep greens",
    preview: {
      primary: "#228B22",
      secondary: "#F0FFF0",
      accent: "#DAA520",
    },
  },
  purple: {
    name: "Deep Purple",
    description: "Elegant theme with sophisticated purples and silver",
    preview: {
      primary: "#4B0082",
      secondary: "#E6E6FA",
      accent: "#C0C0C0",
    },
  },
  sunset: {
    name: "Warm Sunset",
    description: "Vibrant theme inspired by warm sunset hues",
    preview: {
      primary: "#FF4500",
      secondary: "#FFFACD",
      accent: "#FFD700",
    },
  },
  ocean: {
    name: "Ocean Breeze",
    description: "Refreshing theme with cool blues and teals",
    preview: {
      primary: "#1E90FF",
      secondary: "#E0FFFF",
      accent: "#40E0D0",
    },
  },
  monochrome: {
    name: "Monochrome",
    description: "Sleek minimalist theme with gray tones",
    preview: {
      primary: "#36454F",
      secondary: "#F5F5F5",
      accent: "#00CED1",
    },
  },
  onedark: {
    name: "One Dark Pro",
    description: "Popular VSCode theme based on Atom's One Dark",
    preview: {
      primary: "#61afef",
      secondary: "#282c34",
      accent: "#e06c75",
    },
  },
  dracula: {
    name: "Dracula",
    description: "Classic dark theme with vibrant purple accents",
    preview: {
      primary: "#bd93f9",
      secondary: "#282a36",
      accent: "#ff79c6",
    },
  },
  palenight: {
    name: "Material Palenight",
    description: "Material Design inspired theme with soft colors",
    preview: {
      primary: "#82aaff",
      secondary: "#292d3e",
      accent: "#c792ea",
    },
  },
  nord: {
    name: "Nord",
    description: "Clean Nordic-inspired theme with cool colors",
    preview: {
      primary: "#88c0d0",
      secondary: "#2e3440",
      accent: "#ebcb8b",
    },
  },
  synthwave: {
    name: "Synthwave '84",
    description: "Retro synthwave theme with neon pink accents",
    preview: {
      primary: "#ff79c6",
      secondary: "#1e1e2e",
      accent: "#bd93f9",
    },
  },
};

export function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const { theme, setTheme } = useTheme();

  const handlePreview = (themeKey: Theme) => {
    setSelectedTheme(themeKey);
    // Apply theme immediately for preview
    if (setTheme) {
      setTheme(themeKey);
    }
  };

  const handleApply = () => {
    if (selectedTheme) {
      setOpen(false);
      setSelectedTheme(null);
    }
  };

  const handleCancel = () => {
    // Restore original theme if cancelled
    if (selectedTheme && setTheme && theme !== selectedTheme) {
      setTheme(theme);
    }
    setSelectedTheme(null);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <Settings className="w-4 h-4" />
        Theme
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Select Theme</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {Object.entries(themes).map(([key, themeInfo]) => (
              <ThemePreview
                key={key}
                theme={key as Theme}
                themeInfo={themeInfo}
                isSelected={
                  selectedTheme === key || (theme === key && !selectedTheme)
                }
                isCurrent={theme === key}
                onSelect={() => handlePreview(key as Theme)}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedTheme}
              className="bg-primary hover:bg-primary/90"
            >
              Apply {selectedTheme && themes[selectedTheme].name}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
