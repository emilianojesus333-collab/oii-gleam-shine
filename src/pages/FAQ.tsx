import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  CreditCard, 
  Dumbbell, 
  Utensils, 
  MessageCircle, 
  Shield, 
  Smartphone,
  Settings,
  Zap,
  HelpCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  items: FAQItem[];
}

const FAQ = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const faqCategories: FAQCategory[] = language === 'pt' ? [
    {
      id: "subscription",
      name: "Subscrição & Pagamentos",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-500",
      items: [
        {
          question: "Como cancelo a minha subscrição?",
          answer: "Vai a Definições > Subscrição > Gerir. Serás redirecionado para o portal de pagamento onde podes cancelar a qualquer momento. A tua subscrição permanecerá ativa até ao final do período pago."
        },
        {
          question: "Posso obter reembolso?",
          answer: "Oferecemos reembolso total nos primeiros 7 dias após a compra. Após esse período, podes cancelar a subscrição mas não haverá reembolso do período atual. Contacta o suporte para solicitar."
        },
        {
          question: "Que métodos de pagamento são aceites?",
          answer: "Aceitamos cartões de crédito/débito (Visa, Mastercard, American Express), PayPal, Apple Pay e Google Pay. Todos os pagamentos são processados de forma segura."
        },
        {
          question: "A subscrição renova automaticamente?",
          answer: "Sim, a subscrição renova automaticamente no final de cada período. Podes desativar a renovação automática a qualquer momento nas definições de subscrição."
        }
      ]
    },
    {
      id: "workout",
      name: "Treinos & Exercícios",
      icon: Dumbbell,
      color: "from-orange-500 to-red-500",
      items: [
        {
          question: "Posso alterar o meu plano de treino?",
          answer: "Sim! Vai a Definições e edita o teu calendário semanal. Também podes pedir ao assistente IA para gerar novos treinos personalizados baseados nos teus objetivos."
        },
        {
          question: "Como funciona o gerador de treinos com IA?",
          answer: "O nosso sistema analisa os teus dados do onboarding (experiência, objetivos, disponibilidade) e gera treinos otimizados. Podes regenerar ou ajustar a qualquer momento."
        },
        {
          question: "Como registo as minhas séries e repetições?",
          answer: "Durante o treino, clica em cada exercício para expandir e registar peso, séries e repetições. Os dados são guardados automaticamente e usados para tracking de progresso."
        },
        {
          question: "O que é o 1RM e como é calculado?",
          answer: "1RM (One Rep Max) é o peso máximo que consegues levantar numa única repetição. Calculamos usando a fórmula de Epley baseada nos teus registos de treino."
        }
      ]
    },
    {
      id: "nutrition",
      name: "Nutrição & Alimentação",
      icon: Utensils,
      color: "from-green-500 to-lime-500",
      items: [
        {
          question: "Como funciona o tracking nutricional?",
          answer: "Na página de Nutrição, podes adicionar refeições manualmente, usar o scanner de alimentos com IA, ou explorar planos de refeições sugeridos. Acompanhamos calorias, proteínas, carboidratos e gorduras."
        },
        {
          question: "Como uso o scanner de alimentos?",
          answer: "Clica no ícone da câmara na página de Nutrição, tira uma foto da tua refeição e a IA identificará os alimentos e estimará os macros. Podes ajustar as quantidades manualmente."
        },
        {
          question: "As calorias são calculadas automaticamente?",
          answer: "Sim! Baseado nos teus dados (peso, altura, idade, nível de atividade, objetivo), calculamos as tuas necessidades calóricas diárias e distribuição de macros recomendada."
        },
        {
          question: "Posso personalizar as minhas metas nutricionais?",
          answer: "Sim, podes ajustar as tuas metas de calorias e macros nas definições do perfil nutricional. Também podes alterar o teu objetivo (perda de peso, ganho muscular, manutenção)."
        }
      ]
    },
    {
      id: "ai",
      name: "Assistente IA",
      icon: MessageCircle,
      color: "from-violet-500 to-purple-500",
      items: [
        {
          question: "O assistente IA lembra-se das conversas?",
          answer: "Sim! O assistente tem memória das tuas conversas anteriores e conhece os teus dados do onboarding para dar respostas personalizadas e contextualizadas."
        },
        {
          question: "Posso dar um nome ao meu assistente?",
          answer: "Sim! Durante o onboarding ou nas definições, podes escolher um nome personalizado para o teu assistente IA."
        },
        {
          question: "Que tipo de perguntas posso fazer?",
          answer: "Podes perguntar sobre treinos, nutrição, técnicas de exercícios, motivação, recuperação, e muito mais. O assistente está treinado para te ajudar em toda a tua jornada fitness."
        },
        {
          question: "As respostas da IA são confiáveis?",
          answer: "O nosso assistente é baseado em modelos avançados e treinado com informação científica. No entanto, para questões médicas específicas, recomendamos consultar um profissional de saúde."
        }
      ]
    },
    {
      id: "privacy",
      name: "Privacidade & Segurança",
      icon: Shield,
      color: "from-blue-500 to-cyan-500",
      items: [
        {
          question: "Os meus dados estão seguros?",
          answer: "Absolutamente. Usamos encriptação de ponta a ponta, servidores seguros, e seguimos as normas RGPD. Os teus dados nunca são vendidos a terceiros."
        },
        {
          question: "Posso exportar os meus dados?",
          answer: "Sim! Nas Definições, tens a opção de exportar todos os teus dados (treinos, nutrição, medidas) em formato compatível. O processo é instantâneo."
        },
        {
          question: "Como posso apagar a minha conta?",
          answer: "Nas Definições, encontras a opção de eliminar a conta. Isto remove permanentemente todos os teus dados. Esta ação é irreversível."
        },
        {
          question: "Quem tem acesso aos meus dados?",
          answer: "Apenas tu tens acesso aos teus dados pessoais. A nossa equipa técnica pode aceder apenas para suporte, e todos os acessos são registados e auditados."
        }
      ]
    },
    {
      id: "app",
      name: "Aplicação & Técnico",
      icon: Smartphone,
      color: "from-pink-500 to-rose-500",
      items: [
        {
          question: "A app funciona offline?",
          answer: "Algumas funcionalidades funcionam offline (ver treinos guardados, histórico), mas funcionalidades como IA, sincronização e scanner requerem conexão à internet."
        },
        {
          question: "Como instalo a app no telemóvel?",
          answer: "No browser do telemóvel, abre o site e usa a opção 'Adicionar ao Ecrã Inicial'. Isto cria um atalho que funciona como uma app nativa (PWA)."
        },
        {
          question: "Como reporto um bug?",
          answer: "Usa a página de Suporte para reportar problemas técnicos. Inclui o máximo de detalhes possível (dispositivo, browser, passos para reproduzir). Respondemos em 24-48h."
        }
      ]
    }
  ] : [
    {
      id: "subscription",
      name: "Subscription & Payments",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-500",
      items: [
        {
          question: "How do I cancel my subscription?",
          answer: "Go to Settings > Subscription > Manage. You'll be redirected to the payment portal where you can cancel at any time. Your subscription will remain active until the end of the paid period."
        },
        {
          question: "Can I get a refund?",
          answer: "We offer a full refund within the first 7 days after purchase. After that period, you can cancel your subscription but there will be no refund for the current period. Contact support to request."
        },
        {
          question: "What payment methods are accepted?",
          answer: "We accept credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All payments are processed securely."
        },
        {
          question: "Does the subscription renew automatically?",
          answer: "Yes, the subscription renews automatically at the end of each period. You can disable automatic renewal at any time in the subscription settings."
        }
      ]
    },
    {
      id: "workout",
      name: "Workouts & Exercises",
      icon: Dumbbell,
      color: "from-orange-500 to-red-500",
      items: [
        {
          question: "Can I change my workout plan?",
          answer: "Yes! Go to Settings and edit your weekly calendar. You can also ask the AI assistant to generate new personalized workouts based on your goals."
        },
        {
          question: "How does the AI workout generator work?",
          answer: "Our system analyzes your onboarding data (experience, goals, availability) and generates optimized workouts. You can regenerate or adjust at any time."
        },
        {
          question: "How do I log my sets and reps?",
          answer: "During the workout, click on each exercise to expand and log weight, sets, and reps. Data is saved automatically and used for progress tracking."
        },
        {
          question: "What is 1RM and how is it calculated?",
          answer: "1RM (One Rep Max) is the maximum weight you can lift in a single repetition. We calculate it using the Epley formula based on your training logs."
        }
      ]
    },
    {
      id: "nutrition",
      name: "Nutrition & Diet",
      icon: Utensils,
      color: "from-green-500 to-lime-500",
      items: [
        {
          question: "How does nutritional tracking work?",
          answer: "On the Nutrition page, you can add meals manually, use the AI food scanner, or explore suggested meal plans. We track calories, protein, carbs, and fat."
        },
        {
          question: "How do I use the food scanner?",
          answer: "Click the camera icon on the Nutrition page, take a photo of your meal, and the AI will identify the foods and estimate macros. You can manually adjust quantities."
        },
        {
          question: "Are calories calculated automatically?",
          answer: "Yes! Based on your data (weight, height, age, activity level, goal), we calculate your daily caloric needs and recommended macro distribution."
        },
        {
          question: "Can I customize my nutritional goals?",
          answer: "Yes, you can adjust your calorie and macro goals in the nutritional profile settings. You can also change your goal (weight loss, muscle gain, maintenance)."
        }
      ]
    },
    {
      id: "ai",
      name: "AI Assistant",
      icon: MessageCircle,
      color: "from-violet-500 to-purple-500",
      items: [
        {
          question: "Does the AI assistant remember conversations?",
          answer: "Yes! The assistant has memory of your previous conversations and knows your onboarding data to give personalized and contextualized responses."
        },
        {
          question: "Can I name my assistant?",
          answer: "Yes! During onboarding or in settings, you can choose a custom name for your AI assistant."
        },
        {
          question: "What kind of questions can I ask?",
          answer: "You can ask about workouts, nutrition, exercise techniques, motivation, recovery, and more. The assistant is trained to help you throughout your fitness journey."
        },
        {
          question: "Are the AI responses reliable?",
          answer: "Our assistant is based on advanced models and trained with scientific information. However, for specific medical questions, we recommend consulting a healthcare professional."
        }
      ]
    },
    {
      id: "privacy",
      name: "Privacy & Security",
      icon: Shield,
      color: "from-blue-500 to-cyan-500",
      items: [
        {
          question: "Is my data secure?",
          answer: "Absolutely. We use end-to-end encryption, secure servers, and follow GDPR standards. Your data is never sold to third parties."
        },
        {
          question: "Can I export my data?",
          answer: "Yes! In Settings, you have the option to export all your data (workouts, nutrition, measurements) in a compatible format. The process is instant."
        },
        {
          question: "How can I delete my account?",
          answer: "In Settings, you'll find the option to delete your account. This permanently removes all your data. This action is irreversible."
        },
        {
          question: "Who has access to my data?",
          answer: "Only you have access to your personal data. Our technical team can only access it for support purposes, and all accesses are logged and audited."
        }
      ]
    },
    {
      id: "app",
      name: "App & Technical",
      icon: Smartphone,
      color: "from-pink-500 to-rose-500",
      items: [
        {
          question: "Does the app work offline?",
          answer: "Some features work offline (view saved workouts, history), but features like AI, sync, and scanner require an internet connection."
        },
        {
          question: "How do I install the app on my phone?",
          answer: "On your phone's browser, open the site and use the 'Add to Home Screen' option. This creates a shortcut that works like a native app (PWA)."
        },
        {
          question: "How do I report a bug?",
          answer: "Use the Support page to report technical issues. Include as many details as possible (device, browser, steps to reproduce). We respond within 24-48h."
        }
      ]
    }
  ];

  const uiText = {
    en: {
      title: "Frequently Asked Questions",
      heroTitle: "How can we help?",
      heroSubtitle: "Search or explore by category",
      searchPlaceholder: "Search questions...",
      results: "result",
      resultsPlural: "results",
      allCategories: "All",
      noResultsTitle: "No results found",
      noResultsText: "Try searching with other words or",
      contactSupport: "contact support",
      ctaTitle: "Didn't find what you were looking for?",
      ctaSubtitle: "Our team is ready to help",
      ctaButton: "Contact Support"
    },
    pt: {
      title: "Perguntas Frequentes",
      heroTitle: "Como podemos ajudar?",
      heroSubtitle: "Pesquisa ou explora por categoria",
      searchPlaceholder: "Pesquisar perguntas...",
      results: "resultado",
      resultsPlural: "resultados",
      allCategories: "Todas",
      noResultsTitle: "Nenhum resultado encontrado",
      noResultsText: "Tenta pesquisar com outras palavras ou",
      contactSupport: "contacta o suporte",
      ctaTitle: "Não encontraste o que procuravas?",
      ctaSubtitle: "A nossa equipa está pronta para ajudar",
      ctaButton: "Contactar Suporte"
    }
  };

  const t = uiText[language];

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedCategory 
        ? faqCategories.filter(c => c.id === selectedCategory)
        : faqCategories;
    }

    const query = searchQuery.toLowerCase();
    return faqCategories
      .map(category => ({
        ...category,
        items: category.items.filter(
          item => 
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.items.length > 0);
  }, [searchQuery, selectedCategory, faqCategories]);

  const totalResults = filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  const toggleQuestion = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`;
    setOpenQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isQuestionOpen = (categoryId: string, index: number) => {
    return openQuestions.has(`${categoryId}-${index}`);
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
          <h1 className="text-lg font-semibold">{t.title}</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 max-w-3xl mx-auto space-y-6"
      >
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t.heroTitle}</h2>
          <p className="text-muted-foreground">
            {t.heroSubtitle}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedCategory(null);
            }}
            placeholder={t.searchPlaceholder}
            className="w-full bg-card border border-border/50 rounded-2xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {totalResults} {totalResults !== 1 ? t.resultsPlural : t.results}
            </span>
          )}
        </div>

        {/* Category Pills */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.allCategories}
            </button>
            {faqCategories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ Categories */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map(category => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-3"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({category.items.length})
                    </span>
                  </div>

                  {/* Questions */}
                  <div className="space-y-2 ml-[52px]">
                    {category.items.map((item, index) => {
                      const isOpen = isQuestionOpen(category.id, index);
                      return (
                        <motion.div
                          key={index}
                          layout
                          className="bg-card rounded-xl border border-border/30 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleQuestion(category.id, index)}
                            className="w-full flex items-center gap-3 p-4 text-left"
                          >
                            <span className="flex-1 font-medium text-foreground">
                              {item.question}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </motion.div>
                          </button>
                          
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <p className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
                                  {item.answer}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* No Results */}
          {filteredCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {t.noResultsTitle}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t.noResultsText}{" "}
                <button
                  onClick={() => navigate("/support")}
                  className="text-primary underline"
                >
                  {t.contactSupport}
                </button>
              </p>
            </motion.div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 text-center space-y-4">
          <Zap className="w-8 h-8 text-primary mx-auto" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              {t.ctaTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t.ctaSubtitle}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/support")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
          >
            {t.ctaButton}
          </motion.button>
        </div>

        <div className="pb-8" />
      </motion.div>
    </div>
  );
};

export default FAQ;
