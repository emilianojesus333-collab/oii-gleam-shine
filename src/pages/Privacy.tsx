import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-[#2A2A2A]">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Política de Privacidade</h1>
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
          <h2 className="text-xl font-semibold">1. Informações que Recolhemos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Recolhemos informações que você nos fornece diretamente, incluindo:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Dados pessoais (nome, email, idade, peso, altura)</li>
            <li>Dados de fitness (objetivos, experiência, treinos)</li>
            <li>Dados nutricionais (refeições registadas)</li>
            <li>Fotos de progresso (quando fornecidas)</li>
            <li>Conversas com o assistente IA</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Como Utilizamos os Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos as suas informações para:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Personalizar planos de treino e nutrição</li>
            <li>Fornecer coaching inteligente através da IA</li>
            <li>Acompanhar o seu progresso</li>
            <li>Melhorar os nossos serviços</li>
            <li>Processar pagamentos de subscrição</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Armazenamento e Segurança</h2>
          <p className="text-muted-foreground leading-relaxed">
            Os seus dados são armazenados de forma segura em servidores protegidos. 
            Utilizamos encriptação e outras medidas de segurança para proteger as suas informações.
            Os dados de pagamento são processados pelo Stripe e nunca são armazenados nos nossos servidores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Partilha de Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Não vendemos nem partilhamos os seus dados pessoais com terceiros, exceto:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Processadores de pagamento (Stripe)</li>
            <li>Serviços de IA para personalização (dados anonimizados)</li>
            <li>Quando exigido por lei</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Os Seus Direitos (RGPD)</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao abrigo do RGPD, você tem direito a:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Aceder aos seus dados pessoais</li>
            <li>Retificar dados incorretos</li>
            <li>Eliminar os seus dados ("direito ao esquecimento")</li>
            <li>Exportar os seus dados</li>
            <li>Opor-se ao processamento</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Cookies e Tecnologias</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos armazenamento local para manter a sua sessão ativa e guardar 
            preferências. Não utilizamos cookies de rastreamento de terceiros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Retenção de Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Mantemos os seus dados enquanto a sua conta estiver ativa. 
            Após eliminação da conta, os dados são removidos no prazo de 30 dias.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Menores de Idade</h2>
          <p className="text-muted-foreground leading-relaxed">
            O LiftMate destina-se a utilizadores com 16 anos ou mais. 
            Não recolhemos intencionalmente dados de menores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Alterações à Política</h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos atualizar esta política periodicamente. 
            Notificaremos sobre alterações significativas através da aplicação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para questões sobre privacidade ou exercer os seus direitos, 
            contacte-nos através das definições da aplicação.
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

export default Privacy;
