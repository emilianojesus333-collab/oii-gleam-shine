import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Check, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage, languages, type Language } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface LanguageSelectorProps {
  inline?: boolean;
}

export const LanguageSelector = ({ inline }: LanguageSelectorProps) => {
  const { language, setLanguage, t, getLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = getLanguageOption(language);

  const handleSelectLanguage = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
    toast.success(t("settings.languageUpdated"));
  };

  const triggerContent = (
    <button
      onClick={() => setIsOpen(true)}
      className={`flex w-full items-center gap-3 ${
        inline
          ? "rounded-2xl px-3 py-3 transition-colors active:bg-muted/20"
          : "justify-between"
      }`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted/30">
        <Globe className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="flex-1 text-left">
        <span className="text-sm font-medium text-foreground">{t("settings.language")}</span>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="text-sm">{currentLanguage?.flag}</span>
          {currentLanguage?.nativeName}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
    </button>
  );

  return (
    <>
      {inline ? (
        triggerContent
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4"
          style={{ borderLeft: "2px solid #3B82F6" }}
        >
          {triggerContent}
        </motion.div>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-[20px] border-t border-border/30 bg-card">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-foreground">{t("settings.selectLanguage")}</SheetTitle>
          </SheetHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pb-6">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <motion.button
                  key={lang.code}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
                    isSelected
                      ? "border border-primary/30 bg-primary/20"
                      : "bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {lang.nativeName}
                      </p>
                      <p className="text-xs text-muted-foreground">{lang.name}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
