import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Ruler, Weight, Calendar, Edit2, Check, X, Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load avatar
  useEffect(() => {
    if (!user?.id) return;
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(`${user.id}/avatar`);
    // Check if file exists by appending timestamp
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
  }, [user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const { error } = await supabase.storage
        .from("avatars")
        .upload(`${user.id}/avatar`, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(`${user.id}/avatar`);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao carregar foto");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const calculateAge = (birthYear: string) => {
    if (!birthYear) return null;
    return new Date().getFullYear() - parseInt(birthYear);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!editData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const currentOnboardingData = settings?.onboarding_data as any || {};
    const updatedOnboardingData = {
      ...currentOnboardingData,
      personal: editData,
      personalData: editData
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
      className="rounded-none overflow-hidden mb-2"
      style={{ background: "#1A1A1A", borderRadius: 0, border: "none", borderBottom: "1px solid #2A2A2A", padding: "20px 16px", width: "100%", margin: 0 }}
    >
      {/* Profile Header */}
      <div className="relative px-5 pt-6 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-foreground">Perfil</span>
        </div>
        <div className="flex items-start gap-4">
          {/* Large Avatar with upload */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-[#111311] overflow-hidden relative group"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <span className="text-2xl font-bold text-primary-foreground">
                  {userData.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            {isUploadingAvatar && (
              <div className="absolute inset-0 w-[72px] h-[72px] rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Name & Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-foreground truncate">{userData.name}</h2>
            </div>
            {isDeveloper && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 mb-1">
                Developer Access
              </Badge>
            )}
            <p className="text-sm text-muted-foreground">
              {[
                userData.height ? `${userData.height}cm` : null,
                userData.weight ? `${userData.weight}kg` : null,
                age ? `${age} anos` : null,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <div className="mt-4">
          {!isEditing ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-semibold transition-colors hover:bg-primary/10"
            >
              <Edit2 className="w-4 h-4" />
              Editar perfil
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/50 text-muted-foreground text-sm font-semibold"
              >
                <X className="w-4 h-4" />
                Cancelar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                <Check className="w-4 h-4" />
                Guardar
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <AnimatePresence mode="wait">
        {isEditing && (
          <motion.div
            key="editing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-5 space-y-3"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <User className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                placeholder="Nome"
                maxLength={30}
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={editData.height}
                onChange={(e) => setEditData({ ...editData, height: e.target.value })}
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                placeholder="Altura (cm)"
                min={100}
                max={250}
              />
              <span className="text-xs text-muted-foreground">cm</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Weight className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                placeholder="Peso (kg)"
                min={30}
                max={200}
              />
              <span className="text-xs text-muted-foreground">kg</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={editData.birthYear}
                onChange={(e) => setEditData({ ...editData, birthYear: e.target.value })}
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                placeholder="Ano de nascimento"
                min={1940}
                max={2010}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
