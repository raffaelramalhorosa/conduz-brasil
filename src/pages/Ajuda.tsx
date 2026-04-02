import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, MessageCircle } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  id: string;
  title: string;
  items: FaqItem[];
};

const faqData: FaqCategory[] = [
  {
    id: "alunos",
    title: "Para Alunos",
    items: [
      {
        question: "Como funciona a plataforma Conduz Brasil?",
        answer:
          "A Conduz Brasil conecta alunos a instrutores e autoescolas certificados. Você cria uma conta, busca instrutores na sua região, escolhe horários disponíveis e agenda suas aulas diretamente pelo app. O pagamento é feito de forma segura e você pode avaliar o instrutor após cada aula.",
      },
      {
        question: "Como encontro um instrutor na minha cidade?",
        answer:
          "Acesse o Marketplace ou o Mapa de Instrutores. Você pode filtrar por cidade, tipo de veículo, preço e disponibilidade. Cada perfil de instrutor mostra avaliações de outros alunos, experiência e documentação verificada.",
      },
      {
        question: "Posso cancelar uma aula agendada?",
        answer:
          "Sim. Cancelamentos com antecedência têm reembolso integral. Para cancelamentos próximos ao horário da aula, aplicam-se as regras da nossa Política de Cancelamento. Acesse 'Minhas Aulas' no painel para cancelar.",
      },
      {
        question: "Como solicito um reembolso?",
        answer:
          "Após cancelar uma aula, o reembolso (quando aplicável) é processado automaticamente. Você pode acompanhar o status em 'Meus Reembolsos' no painel do aluno. O prazo de crédito varia conforme o método de pagamento.",
      },
      {
        question: "O instrutor não compareceu à aula. O que faço?",
        answer:
          "Registre o no-show pelo painel em até 24 horas após o horário da aula. Nossa equipe irá analisar e você receberá o reembolso integral caso confirmado. Instrutores com ocorrências repetidas são suspensos da plataforma.",
      },
      {
        question: "Posso conversar com o instrutor antes de agendar?",
        answer:
          "Sim! Após a criação da conta, você pode enviar mensagens para instrutores pela plataforma antes de efetuar um agendamento. O chat fica disponível no perfil do instrutor.",
      },
    ],
  },
  {
    id: "instrutores",
    title: "Para Instrutores e Autoescolas",
    items: [
      {
        question: "Como me cadastro como instrutor?",
        answer:
          "Acesse a página de cadastro para instrutores, preencha seus dados pessoais e profissionais, envie sua documentação (habilitação, certificações DETRAN) e aguarde a aprovação. O processo leva até 5 dias úteis.",
      },
      {
        question: "Quais documentos são necessários para o cadastro?",
        answer:
          "Para instrutores: CNH categoria B ou superior, certificado de curso de habilitação para instrutor (Lei nº 9.503/97), comprovante de endereço e foto. Para autoescolas: CNPJ ativo, alvará de funcionamento e credenciamento DETRAN.",
      },
      {
        question: "Como funciona o recebimento dos pagamentos?",
        answer:
          "Os valores das aulas são liberados automaticamente após a confirmação de conclusão. O repasse é realizado conforme o plano contratado, com desconto da tarifa de serviço da plataforma.",
      },
      {
        question: "Posso definir minha própria agenda e preços?",
        answer:
          "Sim. Você tem total controle sobre sua disponibilidade, preços por hora/aula e tipos de veículos oferecidos. Tudo é gerenciado pelo seu painel administrativo.",
      },
      {
        question: "Como funcionam os planos de assinatura?",
        answer:
          "A Conduz Brasil oferece planos mensais e anuais para instrutores e autoescolas, com diferentes limites de agendamentos e funcionalidades. Acesse 'Assinaturas' no painel para ver os planos disponíveis.",
      },
    ],
  },
  {
    id: "pagamentos",
    title: "Pagamentos e Reembolsos",
    items: [
      {
        question: "Quais formas de pagamento são aceitas?",
        answer:
          "Aceitamos cartões de crédito e débito (Visa, Mastercard, Elo, Amex), PIX e boleto bancário. Todos os pagamentos são processados com criptografia e certificação PCI-DSS.",
      },
      {
        question: "Meus dados de cartão ficam armazenados?",
        answer:
          "Não. Seus dados de cartão são processados pelo nosso parceiro de pagamentos certificado. A Conduz Brasil não armazena dados completos de cartão em seus servidores.",
      },
      {
        question: "O pagamento é feito antes ou depois da aula?",
        answer:
          "O pagamento é realizado no momento do agendamento, garantindo a reserva do horário. O valor só é liberado ao instrutor após a confirmação de que a aula foi concluída.",
      },
      {
        question: "Em quanto tempo recebo o reembolso?",
        answer:
          "Para cartão de crédito: até 10 dias úteis (pode variar por operadora). Para PIX e débito: até 5 dias úteis. Você pode acompanhar em tempo real na seção 'Reembolsos'.",
      },
      {
        question: "A tarifa de serviço é reembolsável?",
        answer:
          "A tarifa de serviço da plataforma não é reembolsável em cancelamentos sem justa causa pelo aluno fora do prazo estabelecido. Em cancelamentos pelo instrutor, o reembolso é sempre integral, incluindo a tarifa.",
      },
    ],
  },
  {
    id: "conta",
    title: "Conta e Segurança",
    items: [
      {
        question: "Esqueci minha senha. Como recupero?",
        answer:
          "Acesse a página de login e clique em 'Esqueci minha senha'. Enviaremos um link de redefinição para o e-mail cadastrado. O link expira em 1 hora.",
      },
      {
        question: "Como altero meu e-mail ou dados cadastrais?",
        answer:
          "Acesse 'Configurações' no seu painel. Algumas alterações (como e-mail) exigem verificação de identidade por segurança.",
      },
      {
        question: "Como excluo minha conta?",
        answer:
          "Para excluir sua conta, acesse 'Configurações' > 'Conta' > 'Excluir conta'. Dados financeiros são mantidos pelo prazo legal de 5 anos conforme exigência fiscal. Demais dados são anonimizados conforme nossa Política de Privacidade.",
      },
      {
        question: "A plataforma é segura?",
        answer:
          "Sim. Utilizamos criptografia TLS/HTTPS em todas as comunicações, autenticação segura e seguimos as diretrizes da LGPD para proteção de dados pessoais. Nosso banco de dados conta com backups diários e monitoramento 24/7.",
      },
    ],
  },
];

const Ajuda = () => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return faqData;
    const q = search.toLowerCase();
    return faqData
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search]);

  const totalResults = filtered.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-background via-muted/30 to-background py-14 sm:py-16">
        <div className="container-custom text-center max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
            Como podemos ajudar?
          </h1>
          <p className="text-muted-foreground mb-6">
            Encontre respostas para as perguntas mais frequentes sobre a plataforma.
          </p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10 h-11"
              placeholder="Buscar pergunta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <p className="text-sm text-muted-foreground mt-2">
              {totalResults === 0
                ? "Nenhuma pergunta encontrada."
                : `${totalResults} resultado${totalResults !== 1 ? "s" : ""} encontrado${totalResults !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16">
        <div className="container-custom max-w-3xl">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma pergunta encontrada para "{search}".</p>
              <Button asChild variant="outline">
                <Link to="/suporte">Falar com o suporte</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              {filtered.map((category) => (
                <div key={category.id}>
                  <h2 className="text-lg font-semibold font-display text-foreground mb-4 pb-2 border-b border-border">
                    {category.title}
                  </h2>
                  <Accordion type="multiple" className="space-y-2">
                    {category.items.map((item, i) => (
                      <AccordionItem
                        key={i}
                        value={`${category.id}-${i}`}
                        className="border border-border rounded-lg px-4 bg-card"
                      >
                        <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-14 rounded-2xl bg-muted/50 border border-border p-8 text-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold font-display text-foreground mb-2">
              Não encontrou sua resposta?
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              Nossa equipe de suporte está pronta para ajudar com qualquer dúvida específica.
            </p>
            <Button asChild>
              <Link to="/suporte">Falar com o suporte</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Ajuda;
