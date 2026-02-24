import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Check, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage, languages, type Language } from "@/hooks/useLanguage";
import { toast } from "sonner";

export const LanguageSelector = () => {
  const { language, setLanguage, t, getLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = getLanguageOption(language);

  const handleSelectLanguage = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
    toast.success(t("settings.languageUpdated"));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[20px] p-4 border border-border/30 bg-[#111311]">

        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">{t("settings.language")}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="text-base">{currentLanguage?.flag}</span>
                {currentLanguage?.nativeName}
              </p>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="bg-card border-t border-border/30 rounded-t-[20px] max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-foreground">{t("settings.selectLanguage")}</SheetTitle>
          </SheetHeader>
          
          <div className="overflow-y-auto max-h-[60vh] space-y-2 pb-6">
            {languages.map((lang) => {
              const isSelected = language === lang.code;

              return (
                <motion.button
                  key={lang.code}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  isSelected ?
                  "bg-primary/20 border border-primary/30" :
                  "bg-muted/20 hover:bg-muted/40"}`
                  }>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {lang.nativeName}
                      </p>
                      <p className="text-xs text-muted-foreground">{lang.name}</p>
                    </div>
                  </div>
                  
                  {isSelected &&
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  }
                </motion.button>);

            })}
          </div>
        </SheetContent>
      </Sheet>
    </>);

};