import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AlertsCarouselProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode[];
}

export const AlertsCarousel = ({ title, icon, children }: AlertsCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 300);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-sm text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{children.length} itens</span>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                canScrollLeft 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                canScrollRight 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
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
    </div>
  );
};
