import { Link } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { ChevronRight } from "lucide-react";

const sections = [
  { id: "aluno", title: "1. Cancelamento pelo aluno" },
  { id: "instrutor", title: "2. Cancelamento pelo instrutor" },
  { id: "reembolsos", title: "3. Reembolsos" },
  { id: "prazo", title: "4. Prazo de processamento" },
  { id: "excecoes", title: "5. Exceções e casos especiais" },
  { id: "contato", title: "6. Como solicitar" },
];

const PoliticaCancelamento = () => {
  return (
    <PublicLayout>
      <div className="container-custom py-12 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Política de Cancelamento</span>
        </nav>

        <div className="flex gap-12">
          {/* Sticky index — desktop only */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-muted/50 rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Índice</p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
                Política de Cancelamento e Reembolso
              </h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Última atualização: [DATA]
                </span>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Esta política define as regras para cancelamento de aulas e agendamentos realizados através da plataforma Conduz Brasil, bem como as condições para reembolso. Leia atentamente antes de realizar um agendamento.
              </p>
            </div>

            <div className="space-y-10">
              <section id="aluno">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">1. Cancelamento pelo aluno</h2>

                <div className="space-y-3">
                  <div className="flex gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 text-sm">Cancelamento com mais de [X] horas de antecedência</p>
                      <p className="text-green-800 text-sm mt-1">Reembolso integral do valor pago, sem cobrança de taxa de cancelamento.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-900 text-sm">Cancelamento entre [X] e [Y] horas de antecedência</p>
                      <p className="text-yellow-800 text-sm mt-1">Reembolso de [Z]% do valor pago. A taxa restante é retida como compensação pelo bloqueio do horário do instrutor.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                    <div>
                      <p className="font-medium text-red-900 text-sm">Cancelamento com menos de [Y] horas ou no-show</p>
                      <p className="text-red-800 text-sm mt-1">Sem reembolso. O valor integral é retido como compensação ao instrutor pelo horário reservado.</p>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed mt-4">
                  Para cancelar uma aula, acesse seu painel de aluno em <Link to="/aluno/aulas" className="text-primary hover:underline">Minhas Aulas</Link> e selecione "Cancelar". O cancelamento é confirmado instantaneamente.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="instrutor">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">2. Cancelamento pelo instrutor ou autoescola</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Quando o cancelamento é iniciado pelo instrutor ou autoescola:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>O aluno recebe <strong className="text-foreground">reembolso integral</strong> do valor pago, independentemente do prazo;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>O instrutor pode sofrer penalidades na reputação da plataforma em caso de cancelamentos recorrentes;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Cancelamentos por motivo de força maior (saúde, emergências familiares) são avaliados individualmente pelo suporte.</span></li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section id="reembolsos">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">3. Reembolsos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Os reembolsos são processados da seguinte forma:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Cartão de crédito</strong>: estorno na fatura em até [X] dias úteis (prazo varia conforme a operadora do cartão);</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">PIX / débito</strong>: transferência em até [X] dias úteis para a conta de origem;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Crédito na plataforma</strong>: disponível imediatamente para usar em novos agendamentos (opcional).</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  A taxa de serviço cobrada pela Conduz Brasil não é reembolsável em caso de cancelamento sem justa causa pelo aluno após o prazo estabelecido.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="prazo">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">4. Prazo de processamento</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Após a aprovação do reembolso, o prazo para crédito na conta do aluno é de:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Até [X] dias úteis</strong> para reembolsos em cartão de crédito;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Até [X] dias úteis</strong> para reembolsos via PIX ou transferência bancária.</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Você pode acompanhar o status do seu reembolso em <Link to="/aluno/reembolsos" className="text-primary hover:underline">Meus Reembolsos</Link>.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="excecoes">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">5. Exceções e casos especiais</h2>
                <p className="text-muted-foreground leading-relaxed">
                  As seguintes situações podem ser avaliadas individualmente pelo time de suporte da Conduz Brasil:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Emergências médicas documentadas;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Condições climáticas extremas que impossibilitem a realização da aula;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Falha técnica comprovada da plataforma que impediu o cancelamento no prazo;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Erros de cobrança ou duplicidade de pagamento.</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Em todos os casos, é necessário fornecer documentação de suporte. Decisões sobre exceções são definitivas.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="contato">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">6. Como solicitar cancelamento ou reembolso</h2>
                <ol className="space-y-3 text-muted-foreground mt-2">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                    <span>Acesse seu painel e vá em <Link to="/aluno/aulas" className="text-primary hover:underline">Minhas Aulas</Link>;</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                    <span>Selecione a aula e clique em "Cancelar";</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                    <span>Confirme o motivo do cancelamento;</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
                    <span>O reembolso (quando aplicável) é processado automaticamente.</span>
                  </li>
                </ol>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Para casos especiais ou dúvidas, entre em contato com nosso suporte em <Link to="/suporte" className="text-primary hover:underline">Central de Suporte</Link> ou pelo e-mail <strong>[EMAIL DE SUPORTE]</strong>.
                </p>
              </section>
            </div>
          </article>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PoliticaCancelamento;
