import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, MessageCircle, ChevronDown, HelpCircle, CreditCard, Dumbbell, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  subject: z.string().trim().min(1, "Assunto é obrigatório").max(100, "Máximo 100 caracteres"),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(1000, "Máximo 1000 caracteres"),
});

const faqs = [
  {
    icon: CreditCard,
    question: "Como cancelo a minha subscrição?",
    answer: "Vai a Definições > Subscrição > Gerir. Serás redirecionado para o portal de pagamento onde podes cancelar a qualquer momento."
  },
  {
    icon: Dumbbell,
    question: "Posso alterar o meu plano de treino?",
    answer: "Sim! Vai a Definições e edita o teu calendário semanal. Também podes pedir ao assistente IA para gerar novos treinos personalizados."
  },
  {
    icon: Utensils,
    question: "Como funciona o tracking nutricional?",
    answer: "Na página de Nutrição, podes adicionar refeições manualmente, usar o scanner de alimentos com IA, ou explorar planos de refeições sugeridos."
  },
  {
    icon: MessageCircle,
    question: "O assistente IA lembra-se das conversas?",
    answer: "Sim! O assistente tem memória das tuas conversas anteriores e conhece os teus dados do onboarding para dar respostas personalizadas."
  },
  {
    icon: HelpCircle,
    question: "Os meus dados estão seguros?",
    answer: "Absolutamente. Usamos encriptação de ponta e seguimos as normas RGPD. Podes ver mais detalhes na nossa Política de Privacidade."
  },
];

const Support = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = contactSchema.safeParse({ subject, message });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSending(true);
    
    // Simulate sending (in production, this would call an edge function)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Mensagem enviada! Responderemos em breve.");
    setSubject("");
    setMessage("");
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Suporte</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 max-w-2xl mx-auto space-y-8"
      >
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Como podemos ajudar?</h2>
          <p className="text-muted-foreground">
            Encontra respostas rápidas ou entra em contacto connosco
          </p>
        </div>

        {/* FAQ Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Perguntas Frequentes
          </h3>
          
          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              const isOpen = openFaq === index;
              
              return (
                <motion.div
                  key={index}
                  className="bg-card rounded-xl border border-border/30 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="flex-1 font-medium text-foreground">
                      {faq.question}
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`} 
                    />
                  </button>
                  
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed ml-[52px]">
                      {faq.answer}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Enviar Mensagem
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                Assunto
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Problema com pagamento"
                maxLength={100}
                className="w-full bg-card border border-border/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreve o teu problema ou questão..."
                rows={5}
                maxLength={1000}
                className="w-full bg-card border border-border/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {message.length}/1000
              </p>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sending || !subject.trim() || !message.trim()}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Enviar Mensagem
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-xl border border-border/30 p-4 space-y-3">
          <h4 className="font-medium text-foreground">Links Úteis</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/terms")}
              className="px-3 py-1.5 bg-muted/30 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos de Uso
            </button>
            <button
              onClick={() => navigate("/privacy")}
              className="px-3 py-1.5 bg-muted/30 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Política de Privacidade
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="px-3 py-1.5 bg-muted/30 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Definições
            </button>
          </div>
        </div>

        <div className="pb-8" />
      </motion.div>
    </div>
  );
};

export default Support;
