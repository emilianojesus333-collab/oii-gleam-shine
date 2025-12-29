import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import gymBackground from "@/assets/gym-background.jpeg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/home");
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login efetuado com sucesso!");
        navigate("/home");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
            emailRedirectTo: `${window.location.origin}/home`,
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso!");
        navigate("/home");
      }
    } catch (error: any) {
      if (error.message.includes("User already registered")) {
        toast.error("Este email já está registado. Tenta fazer login.");
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou password incorretos.");
      } else {
        toast.error(error.message || "Ocorreu um erro");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar com Google");
      setGoogleLoading(false);
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
            Welcome to
            <br />
            <span className="text-primary">LiftMate</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-gray-300/80 text-lg mt-4"
          >
            Your workout journey starts here.
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
              {/* Google Sign In Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </motion.button>

              {/* Sign Up Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsLogin(false);
                  setShowEmailForm(true);
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold transition-colors"
              >
                Sign Up
              </motion.button>

              {/* Bottom Links */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setShowEmailForm(true);
                  }}
                  className="text-primary font-medium hover:underline transition-all"
                >
                  Log In
                </button>
                <span className="text-gray-500">·</span>
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="text-primary font-medium hover:underline transition-all disabled:opacity-50"
                >
                  Google
                </button>
              </div>
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
                      placeholder="Your name"
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
                    placeholder="Email"
                    required
                    className="w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                    className="w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
                  isLogin ? "Log In" : "Create Account"
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
                    <>Don't have an account? <span className="text-primary font-medium">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="text-primary font-medium">Log In</span></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBackToMain}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  ← Back
                </button>
              </div>
            </motion.form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
