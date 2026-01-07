import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const Terms = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Terms of Use",
      lastUpdate: "Last updated",
      sections: [
        {
          title: "1. Acceptance of Terms",
          description: "By using the LiftMate application, you agree to these Terms of Use. If you do not agree with any of these terms, please do not use the application."
        },
        {
          title: "2. Description of Service",
          description: "LiftMate is a fitness application that offers personalized training plans, nutritional tracking, and AI coaching. The service is provided 'as is' and may be modified at any time."
        },
        {
          title: "3. User Account",
          description: "You are responsible for maintaining the confidentiality of your account and password. All activities carried out on your account are your responsibility."
        },
        {
          title: "4. Subscription and Payments",
          description: "LiftMate offers paid subscriptions. Payments are processed through Stripe. Subscriptions are automatically renewed until cancelled. You can cancel at any time through the application settings."
        },
        {
          title: "5. Health Notice",
          description: "LiftMate does not replace professional medical advice. Consult a doctor before starting any exercise program. We are not responsible for injuries resulting from the use of the application."
        },
        {
          title: "6. Intellectual Property",
          description: "All content, design, and functionalities of LiftMate are the exclusive property of its creators and are protected by copyright."
        },
        {
          title: "7. Limitation of Liability",
          description: "LiftMate will not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of the application."
        },
        {
          title: "8. Changes to Terms",
          description: "We reserve the right to modify these terms at any time. Changes take effect immediately after publication in the application."
        },
        {
          title: "9. Contact",
          description: "For questions about these terms, contact us through the application settings."
        }
      ],
      backButton: "Back"
    },
    pt: {
      title: "Termos de Uso",
      lastUpdate: "Última atualização",
      sections: [
        {
          title: "1. Aceitação dos Termos",
          description: "Ao utilizar a aplicação LiftMate, você concorda com estes Termos de Uso. Se não concordar com algum destes termos, por favor não utilize a aplicação."
        },
        {
          title: "2. Descrição do Serviço",
          description: "O LiftMate é uma aplicação de fitness que oferece planos de treino personalizados, acompanhamento nutricional e coaching por inteligência artificial. O serviço é fornecido 'como está' e pode ser modificado a qualquer momento."
        },
        {
          title: "3. Conta de Utilizador",
          description: "Você é responsável por manter a confidencialidade da sua conta e password. Todas as atividades realizadas na sua conta são da sua responsabilidade."
        },
        {
          title: "4. Subscrição e Pagamentos",
          description: "O LiftMate oferece subscrições pagas. Os pagamentos são processados através do Stripe. As subscrições são renovadas automaticamente até serem canceladas. Pode cancelar a qualquer momento através das definições da aplicação."
        },
        {
          title: "5. Aviso de Saúde",
          description: "O LiftMate não substitui aconselhamento médico profissional. Consulte um médico antes de iniciar qualquer programa de exercícios. Não nos responsabilizamos por lesões resultantes do uso da aplicação."
        },
        {
          title: "6. Propriedade Intelectual",
          description: "Todo o conteúdo, design e funcionalidades do LiftMate são propriedade exclusiva dos seus criadores e estão protegidos por direitos de autor."
        },
        {
          title: "7. Limitação de Responsabilidade",
          description: "O LiftMate não será responsável por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso da aplicação."
        },
        {
          title: "8. Alterações aos Termos",
          description: "Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após publicação na aplicação."
        },
        {
          title: "9. Contacto",
          description: "Para questões sobre estes termos, contacte-nos através das definições da aplicação."
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

export default Terms;
