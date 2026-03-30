import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import gymBackground from "@/assets/gym-background.jpeg";
import { useLanguage } from "@/hooks/useLanguage";
import { PasswordInput } from "@/components/ui/password-input";

type AuthView = "main" | "login" | "register" | "forgotPassword";

const Auth = () => {
  const { t } = useLanguage();
  const [view, setView] = useState<AuthView>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fromLogout = searchParams.get("logout") === "1";
    if (fromLogout) return;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) redirectBasedOnOnboarding(session);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setTimeout(() => redirectBasedOnOnboarding(session), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const redirectBasedOnOnboarding = async (session: Session) => {
    const { data: settings } = await supabase
      .from("user_settings")
      .select("has_completed_onboarding")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (settings?.has_completed_onboarding) {
      navigate("/home", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: settings } = await supabase
        .from("user_settings")
        .select("has_completed_onboarding")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      toast.success(t("auth.loginSuccess"));
      if (settings?.has_completed_onboarding) {
        navigate("/home", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("Invalid login credentials")) {
        toast.error(t("auth.invalidCredentials"));
      } else {
        toast.error(msg || t("common.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
      toast.success(t("auth.accountCreated"));
      navigate("/onboarding", { replace: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("User already registered")) {
        toast.error(t("auth.emailRegistered"));
      } else {
        toast.error(msg || t("common.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Insere o teu email primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar email de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setResetSent(false);
  };

  const goBack = () => {
    resetForm();
    setView("main");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${gymBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between px-6 py-12">
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

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4 max-w-md mx-auto w-full"
        >
          <AnimatePresence mode="wait">

            {/* ── MAIN VIEW ── */}
            {view === "main" && (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("register")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold transition-colors"
                >
                  {t("auth.createAccount")}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("login")}
                  className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-white py-4 rounded-xl font-semibold transition-colors"
                >
                  {t("auth.login")}
                </motion.button>
              </motion.div>
            )}

            {/* ── LOGIN VIEW ── */}
            {view === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
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

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setView("forgotPassword"); }}
                    className="text-sm text-primary/80 hover:text-primary transition-colors"
                  >
                    Esqueceste a password?
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : t("auth.login")}
                </motion.button>

                <div className="flex flex-col items-center gap-3 pt-2">
                  <button type="button" onClick={() => { resetForm(); setView("register"); }} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {t("auth.noAccount")} <span className="text-primary font-medium">{t("auth.createAccount")}</span>
                  </button>
                  <button type="button" onClick={goBack} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> {t("auth.back")}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── REGISTER VIEW ── */}
            {view === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
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

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : t("auth.createAccount")}
                </motion.button>

                <div className="flex flex-col items-center gap-3 pt-2">
                  <button type="button" onClick={() => { resetForm(); setView("login"); }} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {t("auth.hasAccount")} <span className="text-primary font-medium">{t("auth.login")}</span>
                  </button>
                  <button type="button" onClick={goBack} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> {t("auth.back")}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── FORGOT PASSWORD VIEW ── */}
            {view === "forgotPassword" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {resetSent ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">Email enviado!</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Verifica a tua caixa de entrada em <span className="text-white">{email}</span> para redefinir a password.
                      </p>
                    </div>
                    <button
                      onClick={goBack}
                      className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-white py-4 rounded-xl font-semibold transition-colors"
                    >
                      Voltar ao login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center mb-2">
                      <p className="text-white font-semibold text-lg">Recuperar password</p>
                      <p className="text-gray-400 text-sm mt-1">Envia-te um link para redefinir a password.</p>
                    </div>
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
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      ) : "Enviar link de recuperação"}
                    </motion.button>
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-full text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> {t("auth.back")}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          <div className="flex justify-center gap-4 pt-4 text-xs text-gray-400">
            <a href="/terms" className="hover:text-white transition-colors">{t("auth.termsOfUse")}</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-white transition-colors">{t("auth.privacyPolicy")}</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
