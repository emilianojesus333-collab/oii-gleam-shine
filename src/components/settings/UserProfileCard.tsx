import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Ruler, Weight, Calendar, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";

interface UserData {
  name: string;
  height: string;
  weight: string;
  birthYear: string;
  gender: string;
}

export const UserProfileCard = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useUserSettings();
  const { isDeveloper } = useSubscriptionContext();
  const [userData, setUserData] = useState<UserData>({
    name: "",
    height: "",
    weight: "",
    birthYear: "",
    gender: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserData>(userData);

  // Load data from user_settings (database) when settings change
  useEffect(() => {
    if (settings?.onboarding_data) {
      const onboardingData = settings.onboarding_data as any;
      const personalData = onboardingData?.personal || onboardingData?.personalData;
      if (personalData) {
        setUserData(personalData);
        setEditData(personalData);
      }
    }
  }, [settings]);

  const calculateAge = (birthYear: string) => {
    if (!birthYear) return null;
    return new Date().getFullYear() - parseInt(birthYear);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate
    if (!editData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    // Update in database via useUserSettings
    const currentOnboardingData = settings?.onboarding_data as any || {};
    const updatedOnboardingData = {
      ...currentOnboardingData,
      personal: editData,
      personalData: editData // Keep backwards compatibility
    };

    await updateSettings({ onboarding_data: updatedOnboardingData });

    setUserData(editData);
    setIsEditing(false);
    toast.success("Perfil atualizado!");
  };

  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
  };

  const age = calculateAge(userData.birthYear);

  if (!userData.name) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] p-5 border border-border/30 bg-[#111311]">

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {userData.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{userData.name}</h2>
              {isDeveloper && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                  Developer Access
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {age ? `${age} anos` : ""}
            </p>
          </div>
        </div>
        
        {!isEditing ?
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsEditing(true)}
          className="p-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">

            <Edit2 className="w-4 h-4" />
          </motion.button> :

        <div className="flex gap-2">
            <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            className="p-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">

              <X className="w-4 h-4" />
            </motion.button>
            <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="p-2 rounded-lg bg-primary text-primary-foreground">

              <Check className="w-4 h-4" />
            </motion.button>
          </div>
        }
      </div>

      <AnimatePresence mode="wait">
        {isEditing ?
        <motion.div
          key="editing"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3">

            {/* Name */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <User className="w-4 h-4 text-muted-foreground" />
              <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
              placeholder="Nome"
              maxLength={30} />

            </div>

            {/* Height */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <input
              type="number"
              value={editData.height}
              onChange={(e) => setEditData({ ...editData, height: e.target.value })}
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
              placeholder="Altura (cm)"
              min={100}
              max={250} />

              <span className="text-xs text-muted-foreground">cm</span>
            </div>

            {/* Weight */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Weight className="w-4 h-4 text-muted-foreground" />
              <input
              type="number"
              value={editData.weight}
              onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
              placeholder="Peso (kg)"
              min={30}
              max={200} />

              <span className="text-xs text-muted-foreground">kg</span>
            </div>

            {/* Birth Year */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
              type="number"
              value={editData.birthYear}
              onChange={(e) => setEditData({ ...editData, birthYear: e.target.value })}
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
              placeholder="Ano de nascimento"
              min={1940}
              max={2010} />

            </div>
          </motion.div> :

        <motion.div
          key="viewing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-3 gap-3 px-0 py-0 my-0 mx-0">

            {userData.height &&
          <div className="flex-col p-3 bg-muted/20 gap-0 flex items-center justify-center rounded-2xl">
                <Ruler className="w-4 h-4 text-primary mb-1" />
                <span className="text-sm font-semibold text-foreground">{userData.height}</span>
                <span className="text-xs text-muted-foreground">cm</span>
              </div>
          }
            {userData.weight &&
          <div className="flex flex-col items-center p-3 rounded-xl bg-muted/20">
                <Weight className="w-4 h-4 text-primary mb-1" />
                <span className="text-sm font-semibold text-foreground">{userData.weight}</span>
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
          }
            {age &&
          <div className="flex flex-col items-center p-3 rounded-xl bg-muted/20">
                <Calendar className="w-4 h-4 text-primary mb-1" />
                <span className="text-sm font-semibold text-foreground">{age}</span>
                <span className="text-xs text-muted-foreground">anos</span>
              </div>
          }
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>);

};