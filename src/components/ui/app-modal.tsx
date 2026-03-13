import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AppModal = ({ open, onOpenChange, title, children, className }: AppModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        "w-[95vw] sm:w-[92vw] max-w-[560px] h-[85vh] sm:h-[70vh] max-h-[80vh]",
        "bg-gradient-to-b from-zinc-900 to-black border-white/10",
        "rounded-2xl sm:rounded-[20px] p-0 flex flex-col overflow-hidden",
        "shadow-[0_30px_80px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      {title && (
        <DialogHeader className="shrink-0 px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
      )}
      <ScrollArea className="flex-1 min-h-0" type="scroll">
        <div className="px-5 pb-5">
          {children}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);
