import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
        "w-[92vw] max-w-[520px] h-[75vh] max-h-[80vh]",
        "bg-zinc-900 border-white/10",
        "rounded-2xl p-0 flex flex-col overflow-hidden",
        "shadow-[0_30px_80px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      {title && (
        <DialogHeader className="shrink-0 px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-white text-base">
            {title}
          </DialogTitle>
        </DialogHeader>
      )}
      <ScrollArea className="flex-1 min-h-0" type="scroll">
        <div className="px-4 pb-4">
          {children}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);
