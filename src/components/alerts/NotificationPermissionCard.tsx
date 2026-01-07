import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, BellRing, Check, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

interface NotificationPermissionCardProps {
  permission: NotificationPermission;
  isSupported: boolean;
  onRequestPermission: () => Promise<boolean>;
}

export const NotificationPermissionCard = ({
  permission,
  isSupported,
  onRequestPermission,
}: NotificationPermissionCardProps) => {
  const { t } = useLanguage();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async () => {
    setIsRequesting(true);
    await onRequestPermission();
    setIsRequesting(false);
  };

  if (!isSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <BellOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-medium text-red-400">{t("notifications.notSupported")}</p>
            <p className="text-xs text-gray-400">
              {t("notifications.notSupportedDesc")}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (permission === 'granted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <BellRing className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-400">{t("notifications.active")}</p>
            <p className="text-xs text-gray-400">
              {t("notifications.activeDesc")}
            </p>
          </div>
          <Check className="w-5 h-5 text-green-400" />
        </div>
      </motion.div>
    );
  }

  if (permission === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <BellOff className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-400">{t("notifications.blocked")}</p>
            <p className="text-xs text-gray-400">
              {t("notifications.blockedDesc")}
            </p>
          </div>
          <X className="w-5 h-5 text-amber-400" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-4 border border-primary/20 mb-4"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"
        >
          <Bell className="w-5 h-5 text-primary" />
        </motion.div>
        <div className="flex-1">
          <p className="font-medium text-white">{t("notifications.enable")}</p>
          <p className="text-xs text-gray-400">
            {t("notifications.enableDesc")}
          </p>
        </div>
        <Button
          onClick={handleRequest}
          disabled={isRequesting}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          {isRequesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t("notifications.enableBtn")
          )}
        </Button>
      </div>
    </motion.div>
  );
};