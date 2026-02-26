import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Instrutor {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  fotoPerfil?: string;
  visivel: boolean;
  categoria: string;
  documentos: {
    cpf?: string;
    cnh?: string;
    validadeCNH?: string;
  };
  veiculosVinculados: string[];
  horarios: Record<string, {
    ativo: boolean;
    periodos: { inicio: string; fim: string }[];
  }>;
  avaliacoes: {
    media: number;
    total: number;
    distribuicao: Record<string, number>;
  };
  estatisticas: {
    aulasRealizadas: number;
    alunosAtivos: number;
    taxaAprovacao: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  // Affiliation fields
  invitationStatus?: string;
  isAccountLinked?: boolean;
  linkedUserId?: string | null;
  commissionRate?: number;
  fixedFee?: number;
}

export interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
  ano: number;
  categoria: string;
  cor: string;
  foto?: string;
  status: string;
}

const defaultHorarios = {
  segunda: { ativo: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '14:00', fim: '18:00' }] },
  terca: { ativo: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '14:00', fim: '18:00' }] },
  quarta: { ativo: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '14:00', fim: '18:00' }] },
  quinta: { ativo: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '14:00', fim: '18:00' }] },
  sexta: { ativo: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '14:00', fim: '18:00' }] },
  sabado: { ativo: false, periodos: [] },
  domingo: { ativo: false, periodos: [] },
};

export function useAutoescolaData() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  async function fetchData() {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // Get instructor profile ID for the driving school
      const { data: instructorProfile, error: profileError } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (instructorProfile) {
        setInstructorProfileId(instructorProfile.id);
        await Promise.all([
          fetchInstrutores(instructorProfile.id),
          fetchVeiculos(instructorProfile.id)
        ]);
      }
    } catch (error) {
      console.error('Error fetching autoescola data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados da autoescola',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchInstrutores(drivingSchoolId: string) {
    const { data, error } = await supabase
      .from('driving_school_instructors')
      .select('*, profiles:linked_user_id(avatar_url)')
      .eq('driving_school_id', drivingSchoolId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching instructors:', error);
      return;
    }

    // Transform data to match our interface
    const transformedData: Instrutor[] = (data || []).map(instructor => {
      const raw = instructor as any;
      const linkedAvatar = raw.profiles?.avatar_url || null;
      return {
        id: instructor.id,
        nome: instructor.name,
        email: instructor.email,
        telefone: raw.phone || '',
        fotoPerfil: instructor.photo_url || linkedAvatar || '',
        visivel: instructor.status === 'active',
        categoria: (raw.license_categories && raw.license_categories.length > 0) ? raw.license_categories.join('/') : 'B',
        documentos: { cpf: '', cnh: '', validadeCNH: '' },
        veiculosVinculados: raw.linked_vehicle_ids || [],
        horarios: defaultHorarios,
        avaliacoes: { media: 0, total: 0, distribuicao: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } },
        estatisticas: { aulasRealizadas: 0, alunosAtivos: 0, taxaAprovacao: 0 },
        status: instructor.status,
        createdAt: instructor.created_at,
        updatedAt: instructor.updated_at,
        invitationStatus: raw.invitation_status || 'none',
        isAccountLinked: raw.is_account_linked || false,
        linkedUserId: raw.linked_user_id || null,
        commissionRate: raw.commission_rate ?? 0,
        fixedFee: raw.fixed_fee ?? 0,
      };
    });

    setInstrutores(transformedData);
  }

  async function fetchVeiculos(instructorId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching vehicles:', error);
      return;
    }

    const transformedVeiculos: Veiculo[] = (data || []).map(v => ({
      id: v.id,
      modelo: `${v.brand} ${v.model}`,
      placa: v.license_plate,
      ano: v.year,
      categoria: v.license_category,
      cor: v.color || 'N/A',
      foto: v.main_photo_url || '',
      status: 'disponivel'
    }));

    setVeiculos(transformedVeiculos);
  }

  const refetch = () => {
    if (profile?.id) {
      fetchData();
    }
  };

  return {
    instrutores,
    veiculos,
    loading,
    instructorProfileId,
    refetch
  };
}
