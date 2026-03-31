import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileDown,
  Loader2,
  FileText,
  Dumbbell,
  Apple,
  Calendar,
  Check } from
'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter } from
'@/components/ui/drawer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DailyLog, MacroGoals } from '@/hooks/useNutrition';

interface ExportDataProps {
  nutritionLogs: DailyLog[];
  nutritionGoals: MacroGoals;
}

type ExportType = 'workouts' | 'nutrition' | 'both';

export const ExportData = ({ nutritionLogs, nutritionGoals }: ExportDataProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedType, setSelectedType] = useState<ExportType>('both');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const generateWorkoutHTML = (sessions: Record<string, unknown>[]) => {
    if (sessions.length === 0) {
      return '<p>Sem histórico de treinos registado.</p>';
    }

    let html = '<h2 style="color: #8b5cf6; margin-top: 20px;">📋 Histórico de Treinos</h2>';
    html += `<p style="color: #666;">Total de sessões: ${sessions.length}</p>`;

    sessions.slice(0, 30).forEach((session) => {
      const muscleGroups = (session.muscle_groups as string[]) || [];
      const exercisesCompleted = (session.exercises_completed as string[]) || [];
      const exerciseLogs = (session.exercise_logs as any[]) || [];

      html += `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 10px 0;">
          <h3 style="margin: 0 0 10px 0;">${formatDate(session.date as string)} - ${(muscleGroups as string[]).join(' + ')}</h3>
          <p style="margin: 5px 0; color: #666;">Exercícios: ${(exercisesCompleted as string[]).length} | Taxa: ${session.completion_rate || 0}%</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #e0e0e0;">
                <th style="padding: 8px; text-align: left;">Exercício</th>
                <th style="padding: 8px; text-align: center;">Peso</th>
                <th style="padding: 8px; text-align: center;">Reps</th>
                <th style="padding: 8px; text-align: center;">Séries</th>
              </tr>
            </thead>
            <tbody>
              ${(exerciseLogs as Record<string, unknown>[]).map((log) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.name || log.exercise_name || '-'}</td>
                  <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${log.weight || 0}kg</td>
                  <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${log.reps || 0}</td>
                  <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${log.sets || 0}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">Sem detalhes</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    });

    return html;
  };

  const generateNutritionHTML = (logs: DailyLog[], goals: MacroGoals) => {
    if (logs.length === 0) {
      return '<p>Sem histórico de nutrição registado.</p>';
    }

    let html = '<h2 style="color: #22c55e; margin-top: 30px;">🥗 Histórico de Nutrição</h2>';

    // Goals summary
    html += `
      <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; margin: 10px 0;">
        <h3 style="margin: 0 0 10px 0;">Metas Diárias</h3>
        <p style="margin: 5px 0;">Calorias: ${goals.calories} kcal | Proteína: ${goals.protein}g | Carbs: ${goals.carbs}g | Gordura: ${goals.fat}g</p>
      </div>
    `;

    // Daily logs
    logs.slice(0, 30).forEach((log) => {
      const caloriePercent = Math.round(log.totals.calories / goals.calories * 100);
      const proteinPercent = Math.round(log.totals.protein / goals.protein * 100);

      html += `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 10px 0;">
          <h3 style="margin: 0 0 10px 0;">${formatDate(log.date)}</h3>
          <div style="display: flex; gap: 20px; margin-bottom: 10px;">
            <span style="color: ${caloriePercent >= 90 && caloriePercent <= 110 ? '#22c55e' : '#666'};">
              Calorias: ${log.totals.calories}/${goals.calories} kcal (${caloriePercent}%)
            </span>
            <span style="color: ${proteinPercent >= 100 ? '#22c55e' : '#666'};">
              Proteína: ${log.totals.protein}/${goals.protein}g (${proteinPercent}%)
            </span>
          </div>
          <p style="margin: 5px 0; color: #666;">Carbs: ${log.totals.carbs}g | Gordura: ${log.totals.fat}g | Fibra: ${log.totals.fiber}g</p>
          ${log.meals.length > 0 ? `
            <div style="margin-top: 10px;">
              <strong>Refeições (${log.meals.length}):</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${log.meals.map((meal) => `
                  <li>${meal.time} - ${meal.foods.map((f) => f.name).join(', ')} (${meal.total.calories} kcal)</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    });

    return html;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Fetch workout sessions from database
      const { data: { user } } = await supabase.auth.getUser();
      let workoutSessions: Record<string, unknown>[] = [];
      if (user) {
        const { data } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .limit(30);
        workoutSessions = data || [];
      }
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

      let htmlContent = `
        <!DOCTYPE html>
        <html lang="pt">
        <head>
          <meta charset="UTF-8">
          <title>LiftMate - Histórico Exportado</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
            h1 { color: #8b5cf6; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>🏋️ LiftMate - Relatório</h1>
          <p style="color: #666;">Exportado em ${dateStr}</p>
      `;

      if (selectedType === 'workouts' || selectedType === 'both') {
        htmlContent += generateWorkoutHTML(workoutSessions);
      }

      if (selectedType === 'nutrition' || selectedType === 'both') {
        htmlContent += generateNutritionHTML(nutritionLogs, nutritionGoals);
      }

      htmlContent += `
          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999;">
            <p>Gerado por LiftMate</p>
          </footer>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liftmate-relatorio-${now.toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Relatório exportado!', {
        description: 'Abre o ficheiro no browser e usa Ctrl+P para imprimir como PDF.'
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar', {
        description: 'Tenta novamente.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions: {type: ExportType;label: string;icon: typeof FileText;description: string;}[] = [
  { type: 'both', label: 'Tudo', icon: FileText, description: 'Treinos e nutrição' },
  { type: 'workouts', label: 'Treinos', icon: Dumbbell, description: 'Histórico de exercícios' },
  { type: 'nutrition', label: 'Nutrição', icon: Apple, description: 'Refeições e macros' }];


  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild className="bg-[#111311]">
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full bg-card border border-border/30 rounded-[20px] p-5 flex items-center gap-4">

          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
            <FileDown className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-semibold text-foreground">Exportar Dados</h3>
            <p className="text-xs text-muted-foreground">Treinos e nutrição em HTML/PDF</p>
          </div>
        </motion.button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Exportar Histórico
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolhe o que queres exportar. O ficheiro será gerado em HTML que podes abrir no browser e imprimir como PDF.
          </p>

          <div className="space-y-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedType === option.type;

              return (
                <button
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                  isSelected ?
                  'bg-primary/10 border-2 border-primary' :
                  'bg-muted/30 border-2 border-transparent'}`
                  }>

                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-primary/20' : 'bg-muted/50'}`
                  }>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                </button>);

            })}
          </div>

          <div className="p-3 rounded-xl bg-muted/30 flex items-start gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Serão exportados os últimos 30 dias de registos.
            </p>
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            {isExporting ?
            <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A exportar...
              </> :

            <>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar Relatório
              </>
            }
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>);

};