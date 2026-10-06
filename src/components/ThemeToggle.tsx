import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getLabel = () => {
    if (theme === "light") {
      return "Current theme: Light. Click to switch to Dark.";
    }
    if (theme === "dark") {
      return "Current theme: Dark. Click to switch to System.";
    }
    return `Current theme: System (${resolvedTheme}). Click to switch to Light.`;
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className={cn("size-9 shrink-0 text-foreground transition-colors", className)}
      aria-label={getLabel()}
      aria-live="polite"
      title={getLabel()}
    >
      {theme === "light" && <Sun className="size-4" />}
      {theme === "dark" && <Moon className="size-4" />}
      {theme === "system" && <Monitor className="size-4" />}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  );
}
