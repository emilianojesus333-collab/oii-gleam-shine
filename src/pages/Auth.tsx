import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import gymBackground from "@/assets/gym-background.jpeg";
type AuthView = "main" | "login" | "register" | "forgotPassword";

const Auth = () => {
  const [view, setView] = useState<AuthView>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      if (event === "SIGNED_IN" && session) {
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
      toast.success("Login com sucesso!");
      if (settings?.has_completed_onboarding) {
        navigate("/home", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("Invalid login credentials")) {
        toast.error("Credenciais inválidas.");
      } else {
        toast.error(msg || "Erro inesperado.");
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
      toast.success("Conta criada com sucesso!");
      navigate("/onboarding", { replace: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("User already registered")) {
        toast.error("Email já registado.");
      } else {
        toast.error(msg || "Erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Insere o teu email primeiro."); return; }
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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const handleAppleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: window.location.origin } });
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setName(""); setResetSent(false); setShowPassword(false);
  };

  const goBack = () => { resetForm(); setView("main"); };

  // ─────────────────────────────────────────────
  // TELA 1 — SPLASH
  // ─────────────────────────────────────────────
  if (view === "main") {
    return (
      <div
        style={{
          position: "fixed", inset: 0,
          backgroundImage: `url(${gymBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.9) 100%)",
        }} />

        {/* Centro */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: "0.06em", color: "#fff", lineHeight: 1 }}>
              LIFTMATE
            </div>
            <div style={{
              marginTop: 12,
              fontSize: 11, letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
            }}>
              O MOMENTO QUE MUDA O JOGO
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            paddingBottom: 48, paddingLeft: 24, paddingRight: 24,
          }}
        >
          <button
            onClick={() => setView("login")}
            style={{
              width: "100%", height: 44, borderRadius: 12,
              background: "#1D4ED8", color: "#fff", border: "none",
              fontSize: 14, fontWeight: 800, letterSpacing: "0.08em",
              textTransform: "uppercase", cursor: "pointer",
            }}
          >
            ENTRAR
          </button>

          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            <button
              onClick={() => { resetForm(); setView("register"); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}
            >
              {"Criar conta"}
            </button>
            {" • "}
            <button
              onClick={handleGoogleLogin}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}
            >
              Google
            </button>
            {" • "}
            <button
              onClick={handleAppleLogin}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}
            >
              Apple
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // TELA 2 — FORMULÁRIO
  // ─────────────────────────────────────────────
  const isRegister = view === "register";
  const isForgot = view === "forgotPassword";

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          style={{ flex: 1, display: "flex", flexDirection: "column", padding: "56px 24px 40px" }}
        >
          {/* Voltar */}
          <button
            onClick={goBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 32,
              padding: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>

          {/* Título */}
          <div style={{
            fontSize: 32, fontWeight: 900, color: "#fff",
            textTransform: "uppercase", marginBottom: 32, letterSpacing: "-0.01em",
          }}>
            {isForgot ? "RECUPERAR" : isRegister ? "INSCREVA-SE" : "ENTRAR"}
          </div>

          {/* FORGOT PASSWORD */}
          {isForgot && (
            <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {resetSent ? (
                <div style={{ textAlign: "center", paddingTop: 32 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(29,78,216,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Mail size={28} color="#60A5FA" />
                  </div>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Email enviado!</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                    Verifica a tua caixa de entrada em <span style={{ color: "#fff" }}>{email}</span>.
                  </p>
                  <button
                    onClick={goBack}
                    style={{ marginTop: 24, width: "100%", height: 44, background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 8 }}>
                    Envia-te um link para redefinir a password.
                  </p>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Email</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      style={inputStyle}
                    />
                  </div>
                  <button type="submit" disabled={loading} style={submitBtnStyle}>
                    {loading ? <Spinner /> : "Enviar link"}
                  </button>
                </>
              )}
            </form>
          )}

          {/* LOGIN / REGISTER */}
          {!isForgot && (
            <form
              onSubmit={isRegister ? handleRegister : handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Nome (só no registo) */}
              {isRegister && (
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="O teu nome"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="email@exemplo.com"
                  style={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={labelStyle}>Password</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => { resetForm(); setView("forgotPassword"); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.35)" }}
                    >
                      Esqueceu a password?
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={6} placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} style={{ ...submitBtnStyle, marginTop: 4 }}>
                {loading ? <Spinner /> : isRegister ? "Criar conta" : "Entrar"}
              </button>

              {/* Divisor */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>
                  OU CONTINUAR COM
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Google */}
              <button
                type="button" onClick={handleGoogleLogin}
                style={socialBtnStyle}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Continuar com Google</span>
              </button>

              {/* Apple */}
              <button
                type="button" onClick={handleAppleLogin}
                style={socialBtnStyle}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
                  <path d="M12.57 0c.07.9-.26 1.82-.78 2.49-.53.69-1.37 1.22-2.22 1.16-.09-.87.31-1.77.82-2.4C10.9.55 11.8.05 12.57 0zm2.63 6.36c-.14.09-2.07 1.19-2.05 3.55.02 2.81 2.46 3.75 2.5 3.76-.03.1-.39 1.33-1.28 2.59-.78 1.1-1.59 2.19-2.83 2.21-1.22.02-1.61-.72-3-.72-1.4 0-1.84.7-3 .73-1.2.03-2.12-1.17-2.91-2.27C1.15 14.05 0 10.8 0 7.69c0-3.05 2-4.66 3.96-4.69 1.19-.02 2.31.8 3.04.8.72 0 2.08-.99 3.51-.84.6.02 2.28.24 3.35 1.8l-.66.6z"/>
                </svg>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Continuar com Apple</span>
              </button>

              {/* Toggle login/register */}
              <div style={{ textAlign: "center", marginTop: 8 }}>
                {isRegister ? (
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    Já tens conta?{" "}
                    <button
                      type="button"
                      onClick={() => { resetForm(); setView("login"); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#60A5FA", fontSize: 13, fontWeight: 600 }}
                    >
                      Entrar
                    </button>
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    Não tens conta?{" "}
                    <button
                      type="button"
                      onClick={() => { resetForm(); setView("register"); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#60A5FA", fontSize: 13, fontWeight: 600 }}
                    >
                      {"Criar conta"}
                    </button>
                  </span>
                )}
              </div>

              {/* Termos */}
              <div style={{ textAlign: "center", marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                Termos de Uso • Política de Privacidade
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Helpers de estilo ──────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  background: "#1A1A1A",
  border: "none",
  borderRadius: 12,
  color: "#fff",
  fontSize: 15,
  padding: "0 16px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#fff",
  marginBottom: 6,
};

const submitBtnStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  background: "#1D4ED8",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const socialBtnStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
};

const Spinner = () => (
  <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
);

export default Auth;
