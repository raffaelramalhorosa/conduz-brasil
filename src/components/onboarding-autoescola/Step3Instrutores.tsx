import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, User, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDrivingSchoolOnboarding, DrivingSchoolInstructor } from '@/contexts/DrivingSchoolOnboardingContext';
import { useToast } from '@/hooks/use-toast';
import { DrivingSchoolOnboardingLayout } from './DrivingSchoolOnboardingLayout';

export default function Step3Instrutores() {
  const { data, updateData, saveProgress, isSaving } = useDrivingSchoolOnboarding();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addInstructor = () => {
    const newErrors: Record<string, string> = {};

    if (!newInstructor.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!newInstructor.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newInstructor.email)) {
      newErrors.email = 'E-mail inválido';
    }

    // Check for duplicate email
    if (data.instructors.some(i => i.email.toLowerCase() === newInstructor.email.toLowerCase())) {
      newErrors.email = 'Este e-mail já foi adicionado';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const instructor: DrivingSchoolInstructor = {
      id: `temp-${Date.now()}`,
      name: newInstructor.name.trim(),
      email: newInstructor.email.trim().toLowerCase(),
      status: 'pending',
    };

    updateData({
      instructors: [...data.instructors, instructor],
    });

    setNewInstructor({ name: '', email: '' });
    setErrors({});

    toast({
      title: 'Instrutor adicionado',
      description: `${instructor.name} foi adicionado à lista.`,
    });
  };

  const removeInstructor = (id: string) => {
    updateData({
      instructors: data.instructors.filter(i => i.id !== id),
    });

    toast({
      title: 'Instrutor removido',
      description: 'O instrutor foi removido da lista.',
    });
  };

  const handleNext = async () => {
    await saveProgress();
    navigate('/onboarding-autoescola/revisao');
  };

  const handleBack = () => {
    navigate('/onboarding-autoescola/documentacao');
  };

  return (
    <DrivingSchoolOnboardingLayout step={3}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Instrutores</CardTitle>
            <CardDescription>
              Cadastre os instrutores que trabalham na sua autoescola. Eles receberão um convite por e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Instructor Form */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Adicionar novo instrutor</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorName">Nome completo *</Label>
                  <Input
                    id="instructorName"
                    value={newInstructor.name}
                    onChange={(e) => setNewInstructor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="João Silva"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructorEmail">E-mail *</Label>
                  <Input
                    id="instructorEmail"
                    type="email"
                    value={newInstructor.email}
                    onChange={(e) => setNewInstructor(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="joao@autoescola.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <Button onClick={addInstructor} variant="outline" className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Instrutor
              </Button>
            </div>

            {/* Instructors List */}
            {data.instructors.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium">Instrutores cadastrados ({data.instructors.length})</h4>
                
                {data.instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {instructor.photo_url ? (
                          <AvatarImage src={instructor.photo_url} alt={instructor.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{instructor.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{instructor.email}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInstructor(instructor.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum instrutor cadastrado ainda</p>
                <p className="text-sm">Adicione os instrutores da sua autoescola acima</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                ℹ️ Como funciona?
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Os instrutores receberão um convite por e-mail após a aprovação</li>
                <li>• Eles poderão criar suas próprias contas e vincular à autoescola</li>
                <li>• Você pode adicionar mais instrutores depois no painel administrativo</li>
                <li>• Este passo é opcional, você pode prosseguir sem adicionar instrutores</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button variant="outline" onClick={handleBack} size="lg">
            ← Voltar
          </Button>
          <Button onClick={handleNext} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Próxima Etapa →'
            )}
          </Button>
        </div>
      </div>
    </DrivingSchoolOnboardingLayout>
  );
}
