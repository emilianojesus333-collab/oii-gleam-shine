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

const faqCategories: FAQCategory[] = [
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
        question: "Posso adicionar os meus próprios exercícios?",
        answer: "Por agora, usamos uma base de dados curada de exercícios. Podes solicitar novos exercícios através do suporte e consideraremos adicioná-los em futuras atualizações."
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
        question: "A app está disponível em português?",
        answer: "Sim! A app está totalmente traduzida para português de Portugal. Podes alterar o idioma nas definições se preferires inglês."
      },
      {
        question: "Como reporto um bug?",
        answer: "Usa a página de Suporte para reportar problemas técnicos. Inclui o máximo de detalhes possível (dispositivo, browser, passos para reproduzir). Respondemos em 24-48h."
      }
    ]
  }
];

const FAQ = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

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
  }, [searchQuery, selectedCategory]);

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
          <h1 className="text-lg font-semibold">Perguntas Frequentes</h1>
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
          <h2 className="text-2xl font-bold">Como podemos ajudar?</h2>
          <p className="text-muted-foreground">
            Pesquisa ou explora por categoria
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
            placeholder="Pesquisar perguntas..."
            className="w-full bg-card border border-border/50 rounded-2xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
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
              Todas
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
                Nenhum resultado encontrado
              </h3>
              <p className="text-muted-foreground text-sm">
                Tenta pesquisar com outras palavras ou{" "}
                <button
                  onClick={() => navigate("/support")}
                  className="text-primary underline"
                >
                  contacta o suporte
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
              Não encontraste o que procuravas?
            </h3>
            <p className="text-sm text-muted-foreground">
              A nossa equipa está pronta para ajudar
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/support")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
          >
            Contactar Suporte
          </motion.button>
        </div>

        <div className="pb-8" />
      </motion.div>
    </div>
  );
};

export default FAQ;
