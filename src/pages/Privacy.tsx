import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const Privacy = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdate: "Last updated",
      sections: [
        {
          title: "1. Information We Collect",
          description: "We collect information you provide directly, including:",
          items: [
            "Personal data (name, email, age, weight, height)",
            "Fitness data (goals, experience, workouts)",
            "Nutritional data (logged meals)",
            "Progress photos (when provided)",
            "Conversations with AI assistant"
          ]
        },
        {
          title: "2. How We Use Data",
          description: "We use your information to:",
          items: [
            "Personalize training and nutrition plans",
            "Provide intelligent coaching through AI",
            "Track your progress",
            "Improve our services",
            "Process subscription payments"
          ]
        },
        {
          title: "3. Storage and Security",
          description: "Your data is securely stored on protected servers. We use encryption and other security measures to protect your information. Payment data is processed by Stripe and never stored on our servers."
        },
        {
          title: "4. Data Sharing",
          description: "We do not sell or share your personal data with third parties, except:",
          items: [
            "Payment processors (Stripe)",
            "AI services for personalization (anonymized data)",
            "When required by law"
          ]
        },
        {
          title: "5. Your Rights (GDPR)",
          description: "Under GDPR, you have the right to:",
          items: [
            "Access your personal data",
            "Rectify incorrect data",
            "Delete your data ('right to be forgotten')",
            "Export your data",
            "Object to processing"
          ]
        },
        {
          title: "6. Cookies and Technologies",
          description: "We use local storage to keep your session active and save preferences. We do not use third-party tracking cookies."
        },
        {
          title: "7. Data Retention",
          description: "We keep your data while your account is active. After account deletion, data is removed within 30 days."
        },
        {
          title: "8. Minors",
          description: "LiftMate is intended for users aged 16 or older. We do not intentionally collect data from minors."
        },
        {
          title: "9. Policy Changes",
          description: "We may update this policy periodically. We will notify you of significant changes through the application."
        },
        {
          title: "10. Contact",
          description: "For privacy questions or to exercise your rights, contact us through the application settings."
        }
      ],
      backButton: "Back"
    },
    pt: {
      title: "Política de Privacidade",
      lastUpdate: "Última atualização",
      sections: [
        {
          title: "1. Informações que Recolhemos",
          description: "Recolhemos informações que você nos fornece diretamente, incluindo:",
          items: [
            "Dados pessoais (nome, email, idade, peso, altura)",
            "Dados de fitness (objetivos, experiência, treinos)",
            "Dados nutricionais (refeições registadas)",
            "Fotos de progresso (quando fornecidas)",
            "Conversas com o assistente IA"
          ]
        },
        {
          title: "2. Como Utilizamos os Dados",
          description: "Utilizamos as suas informações para:",
          items: [
            "Personalizar planos de treino e nutrição",
            "Fornecer coaching inteligente através da IA",
            "Acompanhar o seu progresso",
            "Melhorar os nossos serviços",
            "Processar pagamentos de subscrição"
          ]
        },
        {
          title: "3. Armazenamento e Segurança",
          description: "Os seus dados são armazenados de forma segura em servidores protegidos. Utilizamos encriptação e outras medidas de segurança para proteger as suas informações. Os dados de pagamento são processados pelo Stripe e nunca são armazenados nos nossos servidores."
        },
        {
          title: "4. Partilha de Dados",
          description: "Não vendemos nem partilhamos os seus dados pessoais com terceiros, exceto:",
          items: [
            "Processadores de pagamento (Stripe)",
            "Serviços de IA para personalização (dados anonimizados)",
            "Quando exigido por lei"
          ]
        },
        {
          title: "5. Os Seus Direitos (RGPD)",
          description: "Ao abrigo do RGPD, você tem direito a:",
          items: [
            "Aceder aos seus dados pessoais",
            "Retificar dados incorretos",
            "Eliminar os seus dados ('direito ao esquecimento')",
            "Exportar os seus dados",
            "Opor-se ao processamento"
          ]
        },
        {
          title: "6. Cookies e Tecnologias",
          description: "Utilizamos armazenamento local para manter a sua sessão ativa e guardar preferências. Não utilizamos cookies de rastreamento de terceiros."
        },
        {
          title: "7. Retenção de Dados",
          description: "Mantemos os seus dados enquanto a sua conta estiver ativa. Após eliminação da conta, os dados são removidos no prazo de 30 dias."
        },
        {
          title: "8. Menores de Idade",
          description: "O LiftMate destina-se a utilizadores com 16 anos ou mais. Não recolhemos intencionalmente dados de menores."
        },
        {
          title: "9. Alterações à Política",
          description: "Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas através da aplicação."
        },
        {
          title: "10. Contacto",
          description: "Para questões sobre privacidade ou exercer os seus direitos, contacte-nos através das definições da aplicação."
        }
      ],
      backButton: "Voltar"
    }
  };

  const t = content[language];

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
        className="p-6 max-w-2xl mx-auto space-y-6"
      >
        <p className="text-muted-foreground text-sm">
          {t.lastUpdate}: {new Date().toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US')}
        </p>

        {t.sections.map((section, index) => (
          <section key={index} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {section.description}
            </p>
            {section.items && (
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="pt-8 pb-12">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium"
          >
            {t.backButton}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;
