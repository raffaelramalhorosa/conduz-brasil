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
import { Mail, Phone, Clock, ChevronRight, CheckCircle2 } from "lucide-react";

const subjects = [
  "Quero ser parceiro (autoescola)",
  "Quero ser instrutor",
  "Dúvidas sobre a plataforma",
  "Imprensa e mídia",
  "Investimentos e parcerias comerciais",
  "Outros assuntos",
];

const Contato = () => {
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
      type: "contact",
    });
    setLoading(false);

    if (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
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
          <span className="text-foreground font-medium">Contato</span>
        </nav>

        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
            Fale conosco
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Seja para apresentar sua autoescola, propor uma parceria ou tirar dúvidas, estamos aqui para ajudar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-muted/50 border border-border">
                <CheckCircle2 className="w-14 h-14 text-green-500 mb-4" />
                <h2 className="text-xl font-semibold font-display text-foreground mb-2">Mensagem enviada!</h2>
                <p className="text-muted-foreground max-w-sm">
                  Recebemos sua mensagem e entraremos em contato em até 2 dias úteis pelo e-mail informado.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSuccess(false)}
                >
                  Enviar outra mensagem
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
                    <Label htmlFor="email">E-mail</Label>
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
                  <Label htmlFor="subject">Assunto</Label>
                  <Select
                    required
                    value={form.subject}
                    onValueChange={(v) => setForm({ ...form, subject: v })}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Selecione um assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Descreva como podemos ajudar..."
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
                  {loading ? "Enviando..." : "Enviar mensagem"}
                </Button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <aside className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-5 border border-border">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">E-mail</p>
                  <p className="text-muted-foreground text-sm mt-0.5">[EMAIL DE CONTATO]</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-5 border border-border">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Telefone / WhatsApp</p>
                  <p className="text-muted-foreground text-sm mt-0.5">[TELEFONE]</p>
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
              <p className="text-sm font-medium text-foreground mb-1">Tempo de resposta</p>
              <p className="text-sm text-muted-foreground">
                Respondemos todas as mensagens em até <strong className="text-foreground">2 dias úteis</strong>.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Para problemas técnicos ou dúvidas sobre aulas,{" "}
              <Link to="/suporte" className="text-primary hover:underline">acesse o Suporte</Link>.
            </p>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contato;
