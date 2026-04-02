import { Link } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { ChevronRight } from "lucide-react";

const sections = [
  { id: "o-que-sao", title: "1. O que são cookies?" },
  { id: "tipos", title: "2. Tipos de cookies que usamos" },
  { id: "terceiros", title: "3. Cookies de terceiros" },
  { id: "gerenciar", title: "4. Como gerenciar cookies" },
  { id: "mais-info", title: "5. Mais informações" },
];

const Cookies = () => {
  return (
    <PublicLayout>
      <div className="container-custom py-12 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Política de Cookies</span>
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
                Política de Cookies
              </h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Última atualização: [DATA]
                </span>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Esta Política de Cookies explica o que são cookies, como a plataforma Conduz Brasil os utiliza e quais são suas opções em relação a eles. Para entender melhor como utilizamos suas informações, leia também nossa{" "}
                <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
              </p>
            </div>

            <div className="space-y-10">
              <section id="o-que-sao">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">1. O que são cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo (computador, smartphone ou tablet) quando você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem de forma eficiente, bem como para fornecer informações aos proprietários do site.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Cookies podem ser "persistentes" (permanecem no dispositivo até serem excluídos ou expirarem) ou "de sessão" (excluídos ao fechar o navegador).
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="tipos">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">2. Tipos de cookies que usamos</h2>
                <div className="space-y-4 mt-2">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Essenciais</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Necessários para o funcionamento básico da plataforma. Incluem cookies de autenticação (manter sua sessão ativa) e de segurança (proteção contra CSRF). Não podem ser desativados.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2"><strong>Exemplos:</strong> token de sessão, preferências de idioma, carrinho de compras.</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Funcionais</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permitem que a plataforma lembre suas preferências e personalize sua experiência, como o seu perfil de usuário e configurações de notificações.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">Analíticos</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nos ajudam a entender como os visitantes interagem com a plataforma, coletando e relatando informações anonimamente para melhorar nossos serviços.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2"><strong>Exemplos:</strong> [FERRAMENTAS DE ANALYTICS UTILIZADAS].</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Marketing</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Utilizados para rastrear visitantes entre sites e exibir anúncios relevantes. [DETALHAR SE APLICÁVEL ou indicar "Não utilizamos cookies de marketing atualmente."]
                    </p>
                  </div>
                </div>
              </section>

              <div className="border-t border-border" />

              <section id="terceiros">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">3. Cookies de terceiros</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Alguns cookies são colocados por serviços de terceiros que aparecem em nossas páginas, como:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Processadores de pagamento</strong> (ex.: Mercado Pago): para segurança das transações;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">Google Maps</strong>: para exibição de mapas de instrutores;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground">[OUTROS SERVIÇOS]</strong>: [DESCRIÇÃO].</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Esses terceiros têm suas próprias políticas de privacidade, sobre as quais não temos controle.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="gerenciar">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">4. Como gerenciar cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Você pode controlar e/ou excluir cookies a qualquer momento pelas configurações do seu navegador. A maioria dos navegadores permite que você:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-3">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Veja quais cookies estão armazenados e os exclua individualmente;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Bloqueie cookies de terceiros;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Bloqueie cookies de sites específicos;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Bloqueie todos os cookies;</span></li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Exclua todos os cookies ao fechar o navegador.</span></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Atenção: desativar cookies essenciais pode afetar o funcionamento da plataforma, incluindo a impossibilidade de fazer login.
                </p>
              </section>

              <div className="border-t border-border" />

              <section id="mais-info">
                <h2 className="text-xl font-semibold font-display text-foreground mb-3">5. Mais informações</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para mais informações sobre cookies e privacidade, entre em contato conosco pelo e-mail <strong>[EMAIL DE PRIVACIDADE]</strong> ou consulte nossa{" "}
                  <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>
              </section>
            </div>
          </article>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Cookies;
