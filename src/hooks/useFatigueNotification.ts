import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const STORAGE_KEY = "liftmate_fatigue_notification_sent";

/**
 * Sends a local-style push notification when fatigue >= 81.
 * Max 1 per day, stored via localStorage flag.
 */
export const useFatigueNotification = () => {
  const checkAndNotify = useCallback(async (fatigueIndex: number | null | undefined) => {
    if (!fatigueIndex || fatigueIndex < 81) return;

    const today = new Date().toDateString();
    const lastSent = localStorage.getItem(STORAGE_KEY);
    if (lastSent === today) return;

    localStorage.setItem(STORAGE_KEY, today);

    // On native platforms, schedule a local notification
    if (Capacitor.isNativePlatform()) {
      try {
        const permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== "granted") return;

        // Use the Capacitor Local Notifications API if available,
        // otherwise fall back to web notification
        if ("Notification" in globalThis && Notification.permission === "granted") {
          new Notification("Recuperação necessária", {
            body: "O teu nível de fadiga está muito alto. Um dia de descanso pode melhorar o teu próximo treino.",
            icon: "/pwa-192x192.png",
          });
        }
      } catch (err) {
        console.error("[FatigueNotification] Error:", err);
      }
    } else if ("Notification" in globalThis && Notification.permission === "granted") {
      // Web fallback
      try {
        new Notification("Recuperação necessária", {
          body: "O teu nível de fadiga está muito alto. Um dia de descanso pode melhorar o teu próximo treino.",
          icon: "/pwa-192x192.png",
        });
      } catch (err) {
        console.error("[FatigueNotification] Web notification error:", err);
      }
    }
  }, []);

  return { checkAndNotify };
};
