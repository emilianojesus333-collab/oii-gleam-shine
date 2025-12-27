import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface WheelPickerProps {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  itemHeight?: number;
  visibleItems?: number;
}

export const WheelPicker = ({
  items,
  value,
  onChange,
  itemHeight = 44,
  visibleItems = 5,
}: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const selectedIndex = items.findIndex((item) => item.value === value);
  const containerHeight = itemHeight * visibleItems;
  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;

  useEffect(() => {
    if (containerRef.current && !isDragging) {
      const scrollTop = selectedIndex * itemHeight;
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, [selectedIndex, itemHeight, isDragging]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    
    if (items[clampedIndex] && items[clampedIndex].value !== value) {
      onChange(items[clampedIndex].value);
    }
  };

  const handleScrollEnd = () => {
    setIsDragging(false);
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    
    containerRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: "smooth",
    });
  };

  return (
    <div 
      className="relative overflow-hidden"
      style={{ height: containerHeight }}
    >
      {/* Selection indicator */}
      <div 
        className="absolute left-0 right-0 pointer-events-none z-10 border-y border-border/30 bg-card/30"
        style={{ 
          top: centerOffset,
          height: itemHeight,
        }}
      />
      
      {/* Gradient overlays */}
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none z-20"
        style={{
          height: centerOffset,
          background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
        }}
      />
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
        style={{
          height: centerOffset,
          background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
        }}
      />
      
      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
        style={{ 
          scrollSnapType: "y mandatory",
          paddingTop: centerOffset,
          paddingBottom: centerOffset,
        }}
        onScroll={handleScroll}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={handleScrollEnd}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={handleScrollEnd}
        onMouseLeave={() => isDragging && handleScrollEnd()}
      >
        {items.map((item, index) => {
          const isSelected = item.value === value;
          
          return (
            <motion.div
              key={item.value}
              className="flex items-center justify-center snap-center cursor-pointer"
              style={{ height: itemHeight }}
              animate={{
                scale: isSelected ? 1 : 0.85,
                opacity: isSelected ? 1 : 0.4,
              }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                onChange(item.value);
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    top: index * itemHeight,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <span className={`text-lg font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
