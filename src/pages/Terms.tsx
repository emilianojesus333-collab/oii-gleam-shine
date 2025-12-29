import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

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
          <h1 className="text-lg font-semibold">Termos de Uso</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 max-w-2xl mx-auto space-y-6"
      >
        <p className="text-muted-foreground text-sm">
          Última atualização: {new Date().toLocaleDateString('pt-PT')}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao utilizar a aplicação LiftMate, você concorda com estes Termos de Uso. 
            Se não concordar com algum destes termos, por favor não utilize a aplicação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
          <p className="text-muted-foreground leading-relaxed">
            O LiftMate é uma aplicação de fitness que oferece planos de treino personalizados, 
            acompanhamento nutricional e coaching por inteligência artificial. O serviço é 
            fornecido "como está" e pode ser modificado a qualquer momento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Conta de Utilizador</h2>
          <p className="text-muted-foreground leading-relaxed">
            Você é responsável por manter a confidencialidade da sua conta e password. 
            Todas as atividades realizadas na sua conta são da sua responsabilidade.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Subscrição e Pagamentos</h2>
          <p className="text-muted-foreground leading-relaxed">
            O LiftMate oferece subscrições pagas. Os pagamentos são processados através do Stripe. 
            As subscrições são renovadas automaticamente até serem canceladas. 
            Pode cancelar a qualquer momento através das definições da aplicação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Aviso de Saúde</h2>
          <p className="text-muted-foreground leading-relaxed">
            O LiftMate não substitui aconselhamento médico profissional. Consulte um médico 
            antes de iniciar qualquer programa de exercícios. Não nos responsabilizamos por 
            lesões resultantes do uso da aplicação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Propriedade Intelectual</h2>
          <p className="text-muted-foreground leading-relaxed">
            Todo o conteúdo, design e funcionalidades do LiftMate são propriedade exclusiva 
            dos seus criadores e estão protegidos por direitos de autor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Limitação de Responsabilidade</h2>
          <p className="text-muted-foreground leading-relaxed">
            O LiftMate não será responsável por quaisquer danos diretos, indiretos, 
            incidentais ou consequenciais resultantes do uso da aplicação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Alterações aos Termos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            As alterações entram em vigor imediatamente após publicação na aplicação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para questões sobre estes termos, contacte-nos através das definições da aplicação.
          </p>
        </section>

        <div className="pt-8 pb-12">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium"
          >
            Voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
