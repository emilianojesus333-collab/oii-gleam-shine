import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import gymBackground from "@/assets/gym-background.jpeg";
import { useLanguage } from "@/hooks/useLanguage";
import { PasswordInput } from "@/components/ui/password-input";

const Auth = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in and redirect based on onboarding status
  useEffect(() => {
    const checkSessionAndOnboarding = async (session: any) => {
      if (!session) return;
      
      // Check onboarding status from database
      const { data: settings } = await supabase
        .from("user_settings")
        .select("has_completed_onboarding")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (settings?.has_completed_onboarding) {
        // User completed onboarding, go to home
        navigate("/home", { replace: true });
      } else {
        // New user or hasn't completed onboarding, go to onboarding
        navigate("/onboarding", { replace: true });
      }
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        checkSessionAndOnboarding(session);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(() => {
          checkSessionAndOnboarding(session);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN: User already has account, check onboarding status
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Check if user completed onboarding
        const { data: settings } = await supabase
          .from("user_settings")
          .select("has_completed_onboarding")
          .eq("user_id", authData.user.id)
          .maybeSingle();
        
        toast.success(t("auth.loginSuccess"));
        
        if (settings?.has_completed_onboarding) {
          navigate("/home", { replace: true });
        } else {
          // Existing user without onboarding (edge case)
          navigate("/onboarding", { replace: true });
        }
      } else {
        // SIGNUP: New user, always go to onboarding
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
        // New users MUST go through onboarding
        navigate("/onboarding", { replace: true });
      }
    } catch (error: any) {
      if (error.message.includes("User already registered")) {
        toast.error(t("auth.emailRegistered"));
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error(t("auth.invalidCredentials"));
      } else {
        toast.error(error.message || t("common.error"));
      }
    } finally {
      setLoading(false);
    }
  };


  const handleBackToMain = () => {
    setShowEmailForm(false);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${gymBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between px-6 py-12">
        {/* Top Section - Title */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-bold text-white leading-tight"
          >
            {t("auth.welcomeTo")}
            <br />
            <span className="text-primary">LiftMate</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-gray-300/80 text-lg mt-4"
          >
            {t("auth.journeyStarts")}
          </motion.p>
        </div>

        {/* Bottom Section - Buttons */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4 max-w-md mx-auto w-full"
        >
          {!showEmailForm ? (
            <>
              {/* Sign Up Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsLogin(false);
                  setShowEmailForm(true);
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold transition-colors"
              >
                {t("auth.createAccount")}
              </motion.button>

              {/* Login Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsLogin(true);
                  setShowEmailForm(true);
                }}
                className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-white py-4 rounded-xl font-semibold transition-colors"
              >
                {t("auth.login")}
              </motion.button>
            </>
          ) : (
            /* Email Form */
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isLogin && (
                <div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("auth.yourName")}
                      className="w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.email")}
                    required
                    className="w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.password")}
                    required
                    minLength={6}
                    className="w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-12 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-auto"
                    iconClassName="text-gray-400 hover:text-white"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
              {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  isLogin ? t("auth.login") : t("auth.createAccount")
                )}
              </motion.button>

              {/* Toggle & Back */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                {isLogin ? (
                    <>{t("auth.noAccount")} <span className="text-primary font-medium">{t("auth.createAccount")}</span></>
                  ) : (
                    <>{t("auth.hasAccount")} <span className="text-primary font-medium">{t("auth.login")}</span></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBackToMain}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  ← {t("auth.back")}
                </button>
              </div>
            </motion.form>
          )}

          {/* Legal Links */}
          <div className="flex justify-center gap-4 pt-4 text-xs text-gray-400">
            <a href="/terms" className="hover:text-white transition-colors">
              {t("auth.termsOfUse")}
            </a>
            <span>•</span>
            <a href="/privacy" className="hover:text-white transition-colors">
              {t("auth.privacyPolicy")}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
