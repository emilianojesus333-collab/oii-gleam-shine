import { motion } from "framer-motion";
import { TrendingUp, Minus, TrendingDown, Activity } from "lucide-react";
import { useWeeklyPerformance } from "@/hooks/useWeeklyPerformance";

export function WeeklyPerformanceWidget() {
  const { data, loading } = useWeeklyPerformance();

  if (loading || !data || data.totalSessions === 0) return null;

  const stats = [
  { value: data.totalSessions, label: "Sessões", icon: Activity, color: "text-foreground" },
  { value: data.progressCount, label: "Progressos", icon: TrendingUp, color: "text-green-400" },
  { value: data.maintainCount, label: "Manutenção", icon: Minus, color: "text-yellow-400" }];


  return;

































}