import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ScrollAreaWithIndicatorsProps {
  children: React.ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal";
  showTopIndicator?: boolean;
  showBottomIndicator?: boolean;
}

export function ScrollAreaWithIndicators({
  children,
  className,
  orientation = "vertical",
  showTopIndicator = true,
  showBottomIndicator = true,
}: ScrollAreaWithIndicatorsProps) {
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = React.useCallback(() => {
    const viewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    if (orientation === "vertical") {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      setCanScrollUp(scrollTop > 5);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 5);
    } else {
      const { scrollLeft, scrollWidth, clientWidth } = viewport;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, [orientation]);

  React.useEffect(() => {
    const viewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    checkScroll();
    viewport.addEventListener("scroll", checkScroll);
    
    // Check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(viewport);

    return () => {
      viewport.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const isVertical = orientation === "vertical";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <ScrollArea className="h-full w-full" type="always">
        {children}
        <ScrollBar orientation={orientation} className="opacity-30 hover:opacity-60 transition-opacity" />
      </ScrollArea>

      {/* Top/Left gradient indicator */}
      {showTopIndicator && (
        <div
          className={cn(
            "pointer-events-none absolute z-10 transition-opacity duration-200",
            isVertical
              ? "inset-x-0 top-0 h-8 bg-gradient-to-b from-zinc-900/80 to-transparent"
              : "inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-900/80 to-transparent",
            isVertical ? (canScrollUp ? "opacity-100" : "opacity-0") : (canScrollLeft ? "opacity-100" : "opacity-0")
          )}
        />
      )}

      {/* Bottom/Right gradient indicator */}
      {showBottomIndicator && (
        <div
          className={cn(
            "pointer-events-none absolute z-10 transition-opacity duration-200",
            isVertical
              ? "inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900/80 to-transparent"
              : "inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-900/80 to-transparent",
            isVertical ? (canScrollDown ? "opacity-100" : "opacity-0") : (canScrollRight ? "opacity-100" : "opacity-0")
          )}
        />
      )}
    </div>
  );
}
