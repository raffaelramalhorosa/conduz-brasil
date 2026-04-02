import { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Clock, ChevronRight, CheckCircle2, AlertCircle, MessageCircle, CreditCard, RefreshCw, User } from "lucide-react";

const subjects = [
  "Problema técnico na plataforma",
  "Dúvida sobre pagamento",
  "Solicitação de reembolso",
  "Problema com agendamento",
  "Problema com mensagens/chat",
  "Dúvida sobre minha conta",
  "Outro",
];

const quickLinks = [
  {
    icon: CreditCard,
    title: "Reembolsos",
    description: "Solicite o reembolso de uma aula",
    href: "/aluno/reembolsos",
    internal: true,
  },
  {
    icon: RefreshCw,
    title: "Política de Cancelamento",
    description: "Entenda as regras de cancelamento",
    href: "/politica",
    internal: true,
  },
  {
    icon: MessageCircle,
    title: "Chat com instrutor",
    description: "Fale diretamente com seu instrutor",
    href: "/aluno/mensagens",
    internal: true,
  },
  {
    icon: User,
    title: "Minha conta",
    description: "Configurações e perfil",
    href: "/aluno/configuracoes",
    internal: true,
  },
];

const Suporte = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.message.trim().length < 10) {
      toast.error("A mensagem deve ter pelo menos 10 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject,
      message: form.message.trim(),
      type: "support",
    });
    setLoading(false);

    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }

    setSuccess(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <PublicLayout>
      <div className="container-custom py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Suporte</span>
        </nav>

        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
            Central de Suporte
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Teve algum problema com a plataforma? Nossa equipe está pronta para ajudar.
          </p>
        </div>

        {/* Quick access */}
        <div className="mb-10">
          <p className="text-sm font-medium text-muted-foreground mb-3">Acesso rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Não encontrou o que precisava acima? Descreva seu problema abaixo.</p>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-muted/50 border border-border">
                <CheckCircle2 className="w-14 h-14 text-green-500 mb-4" />
                <h2 className="text-xl font-semibold font-display text-foreground mb-2">Chamado aberto!</h2>
                <p className="text-muted-foreground max-w-sm">
                  Recebemos seu chamado e entraremos em contato em até 2 dias úteis. Verifique sua caixa de entrada.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSuccess(false)}
                >
                  Abrir outro chamado
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail da conta</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@exemplo.com"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Categoria do problema</Label>
                  <Select
                    required
                    value={form.subject}
                    onValueChange={(v) => setForm({ ...form, subject: v })}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Descreva o problema</Label>
                  <Textarea
                    id="message"
                    placeholder="Descreva o problema com o máximo de detalhes possível. Se houver mensagem de erro, inclua o texto completo."
                    rows={6}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={loading || !form.subject}
                >
                  {loading ? "Enviando..." : "Abrir chamado"}
                </Button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-5 border border-border">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">E-mail de suporte</p>
                  <p className="text-muted-foreground text-sm mt-0.5">[EMAIL DE SUPORTE]</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-5 border border-border">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Horário de atendimento</p>
                  <p className="text-muted-foreground text-sm mt-0.5">Segunda a sexta, das 9h às 18h</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
              <p className="text-sm font-medium text-foreground mb-1">SLA de resposta</p>
              <p className="text-sm text-muted-foreground">
                Respondemos chamados em até <strong className="text-foreground">2 dias úteis</strong>. Casos urgentes (pagamento, segurança) são priorizados.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Para parcerias ou assuntos comerciais,{" "}
              <Link to="/contato" className="text-primary hover:underline">use o formulário de contato</Link>.
            </p>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Suporte;
