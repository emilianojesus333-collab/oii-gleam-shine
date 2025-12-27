import { useNavigate } from "react-router-dom";
import { MessageCircle, Calendar, Dumbbell, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

const weekDaysMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const muscleGroupIcons: Record<string, string> = {
  "Peito": "💪",
  "Costas": "🔙",
  "Pernas": "🦵",
  "Ombros": "🎯",
  "Braços": "💪",
  "Abdômen": "🔥",
  "Glúteos": "🍑",
  "Descanso": "😴",
};

const Home = () => {
  const navigate = useNavigate();

  const { todayWorkout, weekSchedule, userName } = useMemo(() => {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    const data = onboardingData ? JSON.parse(onboardingData) : { schedule: {} };
    
    const today = new Date();
    const todayName = weekDaysMap[today.getDay()];
    const workout = data.schedule?.[todayName] || null;

    // Get next 7 days schedule
    const schedule = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dayName = weekDaysMap[date.getDay()];
      const dayWorkout = data.schedule?.[dayName] || null;
      schedule.push({
        day: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : dayName.split("-")[0],
        fullDay: dayName,
        workout: dayWorkout,
        date: date.getDate(),
      });
    }

    return {
      todayWorkout: workout,
      weekSchedule: schedule,
      userName: "Atleta",
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-12 pb-6"
      >
        <p className="text-muted-foreground">Olá, {userName}</p>
        <h1 className="text-2xl font-bold text-foreground">Pronto para treinar?</h1>
      </motion.header>

      <main className="flex-1 px-6 space-y-6">
        {/* Today's Workout Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Treino de Hoje</p>
              <h2 className="text-xl font-bold text-foreground">
                {todayWorkout || "Dia de descanso"}
              </h2>
            </div>
          </div>

          {todayWorkout && todayWorkout !== "Descanso" && (
            <button
              onClick={() => navigate("/chat")}
              className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-left transition-all hover:bg-secondary/80"
            >
              <span className="font-medium text-foreground">Iniciar treino com IA</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          )}

          {(!todayWorkout || todayWorkout === "Descanso") && (
            <p className="text-muted-foreground">
              {todayWorkout === "Descanso" 
                ? "Aproveita para recuperar e descansar bem!" 
                : "Nenhum treino agendado para hoje."}
            </p>
          )}
        </motion.div>

        {/* Weekly Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Esta semana</h3>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekSchedule.map((item, index) => (
              <motion.div
                key={item.fullDay}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`flex flex-col items-center rounded-xl p-3 ${
                  index === 0 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card text-foreground"
                }`}
              >
                <span className={`text-xs ${index === 0 ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {item.day.slice(0, 3)}
                </span>
                <span className="text-lg font-bold mt-1">{item.date}</span>
                <span className="text-lg mt-1">
                  {item.workout ? muscleGroupIcons[item.workout] || "💪" : "—"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Treinos esta semana</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {weekSchedule.filter(d => d.workout && d.workout !== "Descanso").length}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Dias de descanso</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {weekSchedule.filter(d => !d.workout || d.workout === "Descanso").length}
            </p>
          </div>
        </motion.div>

        {/* Workout List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-semibold text-foreground mb-4">Próximos treinos</h3>
          <div className="space-y-3">
            {weekSchedule
              .filter(d => d.workout && d.workout !== "Descanso")
              .slice(0, 3)
              .map((item, index) => (
                <div
                  key={item.fullDay}
                  className="flex items-center gap-4 rounded-xl bg-card p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                    {muscleGroupIcons[item.workout!] || "💪"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.workout}</p>
                    <p className="text-sm text-muted-foreground">{item.fullDay}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
          </div>
        </motion.div>
      </main>

      {/* Chat FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        onClick={() => navigate("/chat")}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default Home;
