import { Link } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { ChevronRight } from "lucide-react";

const sections = [
  { id: "aceitacao", title: "1. Aceitação dos Termos" },
  { id: "plataforma", title: "2. Uso da Plataforma" },
  { id: "cadastro", title: "3. Cadastro e Conta" },
  { id: "pagamentos", title: "4. Pagamentos e Tarifas" },
  { id: "responsabilidades", title: "5. Responsabilidades" },
  { id: "propriedade", title: "6. Propriedade Intelectual" },
  { id: "rescisao", title: "7. Rescisão" },
  { id: "foro", title: "8. Foro e Legislação Aplicável" },
];

const Termos = () => {
  return (
    <PublicLayout>
      <div className="container-custom py-12 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">
            Início
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Termos de Uso</span>
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
              <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">Termos de Uso</h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Última atualização: [DATA]
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Versão 1.0
                </span>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Estes Termos de Uso regulam o acesso e a utilização da plataforma{" "}
                <strong>R3D3 Desenvolvimentos Tecnológicos LTDA</strong> ("Conduz Brasil"), operada por{" "}
                <strong>R3D3 Desenvolvimentos Tecnológicos LTDA</strong>, inscrita no CNPJ sob o nº{" "}
                <strong>CNPJ 58.473.210/0001-87</strong>, com sede em <strong>Belo Horizonte, Minas Gerais</strong>.
              </p>
            </div>

            <div className="space-y-10 prose prose-neutral max-w-none">
              <section id="aceitacao">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">1. Aceitação dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao acessar ou utilizar a plataforma Conduz Brasil, você declara ter lido, compreendido e concordado
                  com estes Termos de Uso e com a nossa{" "}
                  <Link to="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                  . Se você não concordar com qualquer parte destes termos, não deverá utilizar a plataforma.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  A utilização da plataforma por menores de 18 anos somente é permitida mediante autorização expressa
                  dos pais ou responsáveis legais.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="plataforma">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">2. Uso da Plataforma</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A Conduz Brasil é uma plataforma de intermediação que conecta alunos que desejam obter a Carteira
                  Nacional de Habilitação (CNH) a instrutores e autoescolas credenciados. A plataforma não presta
                  diretamente serviços de instrução veicular.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">É vedado ao usuário:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2 ml-2">
                  <li>Utilizar a plataforma para fins ilegais ou não autorizados;</li>
                  <li>Publicar conteúdo falso, enganoso ou difamatório;</li>
                  <li>Tentar acessar áreas restritas da plataforma sem autorização;</li>
                  <li>
                    Reproduzir, copiar ou explorar comercialmente qualquer parte da plataforma sem autorização prévia e
                    por escrito;
                  </li>
                  <li>Interferir no funcionamento da plataforma ou nos servidores e redes conectados a ela.</li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section id="cadastro">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">3. Cadastro e Conta</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para utilizar as funcionalidades da plataforma, é necessário criar uma conta com informações
                  verdadeiras, precisas, atuais e completas. Você é responsável por manter a confidencialidade de sua
                  senha e por todas as atividades realizadas com sua conta.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Instrutores e autoescolas devem fornecer documentação válida e atualizada para habilitação na
                  plataforma, conforme requisitos definidos pelo DETRAN e legislação vigente. A Conduz Brasil reserva-se
                  o direito de recusar ou cancelar cadastros que não atendam aos critérios de verificação estabelecidos.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Você deve notificar imediatamente a Conduz Brasil sobre qualquer uso não autorizado de sua conta em{" "}
                  <strong>[EMAIL DE SUPORTE]</strong>.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="pagamentos">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">4. Pagamentos e Tarifas</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Os pagamentos realizados na plataforma são processados por meio de parceiros de pagamento certificados
                  (PCI-DSS). Ao realizar uma transação, você concorda com os termos do respectivo processador de
                  pagamento.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  A Conduz Brasil cobra uma tarifa de serviço sobre cada transação realizada na plataforma, conforme
                  divulgado na{" "}
                  <Link to="/sobre" className="text-primary hover:underline">
                    página de preços
                  </Link>
                  . Essa tarifa pode ser alterada mediante aviso prévio de <strong>30 (trinta) dias</strong>.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Cancelamentos e reembolsos estão sujeitos à{" "}
                  <Link to="/politica" className="text-primary hover:underline">
                    Política de Cancelamento
                  </Link>
                  .
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="responsabilidades">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">5. Responsabilidades</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A Conduz Brasil atua como intermediadora entre alunos, instrutores e autoescolas e não se
                  responsabiliza diretamente pela qualidade, segurança ou legalidade dos serviços prestados pelos
                  instrutores. No entanto, a plataforma realiza verificação de documentação e avaliações para manter a
                  qualidade dos profissionais cadastrados.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  A plataforma é fornecida "no estado em que se encontra" e "conforme disponibilidade". A Conduz Brasil
                  não garante que a plataforma estará sempre disponível, livre de erros ou vírus.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Em nenhuma hipótese a Conduz Brasil será responsável por danos indiretos, incidentais, especiais ou
                  consequentes decorrentes do uso ou incapacidade de uso da plataforma, exceto nos casos previstos pelo
                  Código de Defesa do Consumidor (Lei nº 8.078/90).
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="propriedade">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">6. Propriedade Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Todos os direitos de propriedade intelectual relacionados à plataforma, incluindo mas não se limitando
                  a logotipos, marcas, textos, imagens, código-fonte e design, são de titularidade exclusiva da{" "}
                  <strong>[RAZÃO SOCIAL]</strong> ou de seus licenciadores.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  É concedida ao usuário uma licença limitada, não exclusiva, intransferível e revogável para utilizar a
                  plataforma exclusivamente para os fins previstos nestes Termos. Qualquer outro uso requer autorização
                  prévia e escrita da Conduz Brasil.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="rescisao">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">7. Rescisão</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A Conduz Brasil pode encerrar ou suspender seu acesso à plataforma imediatamente, sem aviso prévio,
                  caso você viole estes Termos de Uso ou por qualquer outro motivo a critério exclusivo da plataforma.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Você pode encerrar sua conta a qualquer momento por meio das configurações da plataforma ou entrando
                  em contato com o suporte em <strong>[EMAIL DE SUPORTE]</strong>. O encerramento não elimina obrigações
                  financeiras já contraídas.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="foro">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">
                  8. Foro e Legislação Aplicável
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca
                  de <strong>[CIDADE/ESTADO]</strong> para dirimir quaisquer controvérsias decorrentes destes Termos,
                  renunciando as partes a qualquer outro, por mais privilegiado que seja.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Para dúvidas sobre estes Termos, entre em contato pelo e-mail <strong>[EMAIL JURÍDICO]</strong>.
                </p>
              </section>
            </div>
          </article>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Termos;
