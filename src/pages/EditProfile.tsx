import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  User,
  MapPin,
  Settings,
  Loader2
} from 'lucide-react';
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/lib/masks';

interface FormData {
  full_name: string;
  phone: string;
  // Student fields
  cpf: string;
  date_of_birth: string;
  preferred_transmission: string;
  needs_adapted_vehicle: boolean;
  has_anxiety: boolean;
  // Instructor fields
  bio: string;
  experience_years: string;
  // Address fields
  zipcode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<'student' | 'instructor' | 'driving_school'>('student');
  const [profileId, setProfileId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    phone: '',
    cpf: '',
    date_of_birth: '',
    preferred_transmission: '',
    needs_adapted_vehicle: false,
    has_anxiety: false,
    bio: '',
    experience_years: '',
    zipcode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const isInstructor = userType === 'instructor' || userType === 'driving_school';

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch base profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      setUserType(profileData.user_type);
      setFormData(prev => ({
        ...prev,
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
      }));
      
      // Fetch specific data based on user type
      if (profileData.user_type === 'instructor' || profileData.user_type === 'driving_school') {
        const { data: instructorData } = await supabase
          .from('instructor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (instructorData) {
          setProfileId(instructorData.id);
          setFormData(prev => ({
            ...prev,
            bio: instructorData.bio || '',
            experience_years: instructorData.experience_years?.toString() || '',
            cpf: instructorData.cpf || instructorData.cnpj || '',
            zipcode: instructorData.zipcode || '',
            street: instructorData.street || '',
            number: instructorData.number || '',
            complement: instructorData.complement || '',
            neighborhood: instructorData.neighborhood || '',
            city: instructorData.city || '',
            state: instructorData.state || '',
          }));
        }
        
      } else if (profileData.user_type === 'student') {
        const { data: studentData } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (studentData) {
          setProfileId(studentData.id);
          setFormData(prev => ({
            ...prev,
            cpf: studentData.cpf || '',
            date_of_birth: studentData.date_of_birth || '',
            preferred_transmission: studentData.preferred_transmission || '',
            needs_adapted_vehicle: studentData.needs_adapted_vehicle || false,
            has_anxiety: studentData.has_anxiety || false,
            zipcode: studentData.zipcode || '',
            street: studentData.street || '',
            number: studentData.number || '',
            complement: studentData.complement || '',
            neighborhood: studentData.neighborhood || '',
            city: studentData.city || '',
            state: studentData.state || '',
          }));
        }
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaskedInput = (field: keyof FormData, value: string, maskFn: (v: string) => string) => {
    setFormData(prev => ({ ...prev, [field]: maskFn(value) }));
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Update base profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone.replace(/\D/g, ''),
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // Update specific profile based on user type
      if (isInstructor) {
        const instructorUpdate: Record<string, unknown> = {
          bio: formData.bio,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          zipcode: formData.zipcode.replace(/\D/g, ''),
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
        };

        if (userType === 'driving_school') {
          instructorUpdate.cnpj = formData.cpf.replace(/\D/g, '');
        } else {
          instructorUpdate.cpf = formData.cpf.replace(/\D/g, '');
        }

        const { error: instructorError } = await supabase
          .from('instructor_profiles')
          .update(instructorUpdate)
          .eq('user_id', user.id);
        
        if (instructorError) throw instructorError;

      } else {
        const studentData = {
          user_id: user.id,
          cpf: formData.cpf.replace(/\D/g, ''),
          date_of_birth: formData.date_of_birth || null,
          preferred_transmission: formData.preferred_transmission || null,
          needs_adapted_vehicle: formData.needs_adapted_vehicle,
          has_anxiety: formData.has_anxiety,
          zipcode: formData.zipcode.replace(/\D/g, ''),
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
        };

        const { error: studentError } = await supabase
          .from('student_profiles')
          .upsert(studentData, { onConflict: 'user_id' });
        
        if (studentError) throw studentError;
      }

      toast.success('Perfil atualizado com sucesso!');
      navigate(isInstructor ? '/admin/perfil' : '/aluno/perfil');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const getBackRoute = () => {
    return isInstructor ? '/admin/perfil' : '/aluno/perfil';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="bg-card rounded-lg shadow-sm border p-6 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(getBackRoute())}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Perfil</h1>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Informações Pessoais</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleMaskedInput('phone', e.target.value, maskPhone)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div>
                <Label htmlFor="cpf">
                  {userType === 'driving_school' ? 'CNPJ' : 'CPF'}
                </Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleMaskedInput('cpf', e.target.value, userType === 'driving_school' ? maskCNPJ : maskCPF)}
                  placeholder={userType === 'driving_school' ? '00.000.000/0000-00' : '000.000.000-00'}
                />
              </div>

              {!isInstructor && (
                <div>
                  <Label htmlFor="date_of_birth">Data de Nascimento</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>
              )}

              {isInstructor && (
                <div>
                  <Label htmlFor="experience_years">Anos de Experiência</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => handleInputChange('experience_years', e.target.value)}
                    placeholder="Ex: 5"
                  />
                </div>
              )}
            </div>

            {isInstructor && (
              <div className="mt-4">
                <Label htmlFor="bio">Sobre você</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência e forma de ensinar..."
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Address */}
          <div id="endereco" className="bg-card rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Endereço</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="zipcode">CEP</Label>
                <Input
                  id="zipcode"
                  value={formData.zipcode}
                  onChange={(e) => {
                    handleMaskedInput('zipcode', e.target.value, maskCEP);
                    if (e.target.value.replace(/\D/g, '').length === 8) {
                      fetchAddressByCep(e.target.value);
                    }
                  }}
                  placeholder="00000-000"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Nome da rua"
                />
              </div>
              
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  placeholder="123"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                  placeholder="Apto, bloco, etc (opcional)"
                />
              </div>
              
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              
              <div>
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
                      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
                      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Student Preferences */}
          {!isInstructor && (
            <div id="preferencias" className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Preferências</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="transmission">Tipo de Câmbio Preferido</Label>
                  <Select
                    value={formData.preferred_transmission}
                    onValueChange={(value) => handleInputChange('preferred_transmission', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automático</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Necessita veículo adaptado</p>
                    <p className="text-sm text-muted-foreground">
                      Marque se precisa de veículo com adaptações para PCD
                    </p>
                  </div>
                  <Switch
                    checked={formData.needs_adapted_vehicle}
                    onCheckedChange={(checked) => handleInputChange('needs_adapted_vehicle', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Tenho ansiedade ao dirigir</p>
                    <p className="text-sm text-muted-foreground">
                      Marque para filtrar instrutores especializados em alunos ansiosos
                    </p>
                  </div>
                  <Switch
                    checked={formData.has_anxiety}
                    onCheckedChange={(checked) => handleInputChange('has_anxiety', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(getBackRoute())}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EditProfile;
