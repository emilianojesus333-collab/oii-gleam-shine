import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AlertsCarouselProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode[];
}

export const AlertsCarousel = ({ title, icon, children }: AlertsCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / (clientWidth * 0.85));
    setCurrentIndex(Math.min(index, children.length - 1));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-sm text-white">{title}</h3>
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0 w-[85%] snap-center"
          >
            {child}
          </motion.div>
        ))}
      </div>

      {/* Minimal dot indicators */}
      {children.length > 1 && (
        <div className="flex justify-center gap-1 pt-1">
          {children.map((_, index) => (
            <div 
              key={index}
              className={`w-1 h-1 rounded-full transition-opacity ${
                currentIndex === index ? 'bg-white/50' : 'bg-white/15'
              }`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
