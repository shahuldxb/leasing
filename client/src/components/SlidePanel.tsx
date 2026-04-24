import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg" | "xl" | "2xl" | "full";
  headerAction?: ReactNode;
}

/**
 * SlidePanel — replaces all Dialog modals with a right-side full-height panel.
 * The panel slides in from the right and covers the full viewport height,
 * giving users a full-screen form experience without leaving the page context.
 */
export default function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "xl",
  headerAction,
}: SlidePanelProps) {
  const widthClass = {
    md: "w-full max-w-md",
    lg: "w-full max-w-lg",
    xl: "w-full max-w-xl",
    "2xl": "w-full max-w-2xl",
    full: "w-full",
  }[width];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full z-50 bg-[#111] border-l border-border flex flex-col shadow-2xl",
          widthClass,
          "animate-in slide-in-from-right duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-[#161616] shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {headerAction}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-border px-6 py-4 bg-[#161616] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
