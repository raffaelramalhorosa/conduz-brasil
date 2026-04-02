import { Link } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { ChevronRight } from "lucide-react";

const sections = [
  { id: "dados", title: "1. Dados Coletados" },
  { id: "finalidade", title: "2. Finalidade do Tratamento" },
  { id: "compartilhamento", title: "3. Compartilhamento de Dados" },
  { id: "retencao", title: "4. Retenção e Exclusão" },
  { id: "direitos", title: "5. Direitos do Titular" },
  { id: "seguranca", title: "6. Segurança dos Dados" },
  { id: "cookies", title: "7. Cookies" },
  { id: "dpo", title: "8. Encarregado (DPO)" },
  { id: "alteracoes", title: "9. Alterações desta Política" },
];

const Privacidade = () => {
  return (
    <PublicLayout>
      <div className="container-custom py-12 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Política de Privacidade</span>
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
                Política de Privacidade
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Última atualização: [DATA]
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Em conformidade com a LGPD (Lei nº 13.709/2018)
                </span>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                A <strong>R3D3 Desenvolvimentos Tecnológicos LTDA</strong>, operadora da plataforma Conduz Brasil, CNPJ <strong>58.473.210/0001-87</strong>, com sede em <strong>Belo Horizonte (MG)</strong>, está comprometida com a proteção da privacidade e dos dados pessoais de seus usuários. Esta Política descreve como coletamos, usamos, armazenamos e protegemos suas informações.
              </p>
            </div>

            <div className="space-y-10">
              <section id="dados">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">1. Dados Coletados</h2>
                <p className="text-muted-foreground leading-relaxed">Coletamos as seguintes categorias de dados pessoais:</p>
                <div className="mt-3 space-y-3">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="font-medium text-foreground text-sm mb-1">Dados de identificação</p>
                    <p className="text-muted-foreground text-sm">Nome completo, CPF, data de nascimento, foto de perfil, documento de identidade (para instrutores e autoescolas).</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="font-medium text-foreground text-sm mb-1">Dados de contato</p>
                    <p className="text-muted-foreground text-sm">Endereço de e-mail, número de telefone, endereço residencial/comercial.</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="font-medium text-foreground text-sm mb-1">Dados de uso</p>
                    <p className="text-muted-foreground text-sm">Endereço IP, tipo de dispositivo, navegador, páginas visitadas, data e hora de acesso, ações realizadas na plataforma.</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="font-medium text-foreground text-sm mb-1">Dados financeiros</p>
                    <p className="text-muted-foreground text-sm">Informações de pagamento processadas pelo nosso provedor de pagamentos (não armazenamos dados de cartão diretamente).</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="font-medium text-foreground text-sm mb-1">Dados profissionais (instrutores/autoescolas)</p>
                    <p className="text-muted-foreground text-sm">Habilitações, certificações, experiência, CNPJ, documentos de credenciamento junto ao DETRAN.</p>
                  </div>
                </div>
              </section>

              <div className="border-t border-border" />

              <section id="finalidade">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">2. Finalidade do Tratamento</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">Tratamos seus dados para as seguintes finalidades, com as respectivas bases legais da LGPD:</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Prestação do serviço</strong> (execução de contrato, art. 7º, V): criar e gerenciar sua conta, processar agendamentos e pagamentos.</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Comunicações</strong> (legítimo interesse / consentimento): envio de notificações sobre aulas, mensagens e atualizações da plataforma.</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Segurança e prevenção a fraudes</strong> (legítimo interesse, art. 7º, IX): verificação de identidade e monitoramento de atividades suspeitas.</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Cumprimento de obrigações legais</strong> (art. 7º, II): atendimento a requisições de autoridades competentes.</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Melhoria da plataforma</strong> (legítimo interesse): análise de uso para aprimoramento dos serviços.</span></li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section id="compartilhamento">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">3. Compartilhamento de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Seus dados podem ser compartilhados com:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Instrutores e autoescolas</strong>: dados necessários para a realização das aulas agendadas (nome, contato).</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Processadores de pagamento</strong>: para processamento seguro de transações financeiras.</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Prestadores de serviços de TI</strong>: provedores de infraestrutura, armazenamento em nuvem e segurança.</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Autoridades públicas</strong>: quando exigido por lei ou ordem judicial.</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais sem seu consentimento expresso.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="retencao">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">4. Retenção e Exclusão</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta Política, ou conforme exigido por lei. Em geral:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Dados de conta: enquanto sua conta estiver ativa;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Dados financeiros: até 5 anos após a última transação (obrigação fiscal);</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Logs de acesso: até 6 meses (Marco Civil da Internet, art. 15).</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Ao encerrar sua conta, os dados são anonimizados ou excluídos, salvo quando a retenção for obrigatória por lei.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="direitos">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">5. Direitos do Titular</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Conforme a LGPD (art. 18), você tem os seguintes direitos em relação aos seus dados pessoais:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Confirmação e acesso</strong>: saber se tratamos seus dados e obter cópia deles;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Correção</strong>: corrigir dados incompletos, inexatos ou desatualizados;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Anonimização ou eliminação</strong>: de dados desnecessários ou tratados em desconformidade;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Portabilidade</strong>: receber seus dados em formato estruturado;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Revogação do consentimento</strong>: a qualquer momento, para os tratamentos baseados em consentimento;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Oposição</strong>: ao tratamento realizado com base em legítimo interesse.</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Para exercer seus direitos, entre em contato com o nosso DPO em <strong>[EMAIL DO DPO]</strong>. Responderemos em até 15 dias úteis.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="seguranca">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">6. Segurança dos Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, perda, destruição ou divulgação, incluindo:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Criptografia em trânsito (TLS/HTTPS) e em repouso;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Controles de acesso baseados em função (RBAC);</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Monitoramento contínuo de segurança;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Backups regulares e planos de recuperação.</span></li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section id="cookies">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">7. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma. Para mais detalhes, consulte nossa{" "}
                  <Link to="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="dpo">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">8. Encarregado de Proteção de Dados (DPO)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nosso Encarregado de Proteção de Dados (Data Protection Officer) é responsável por atender solicitações e comunicar-se com a Autoridade Nacional de Proteção de Dados (ANPD).
                </p>
                <div className="mt-3 bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Nome:</strong> Rafael Ramalho Rosa</p>
                  <p className="text-sm text-muted-foreground mt-1"><strong className="text-foreground">E-mail:</strong> atendimento@r3d3s.com.br</p>
                </div>
              </section>

              <div className="border-t border-border" />

              <section id="alteracoes">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">9. Alterações desta Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos atualizar esta Política periodicamente. Em caso de alterações materiais, notificaremos os usuários por e-mail ou por aviso na plataforma com antecedência mínima de 30 dias. O uso continuado da plataforma após as alterações implica na aceitação da nova versão.
                </p>
              </section>
            </div>
          </article>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Privacidade;
