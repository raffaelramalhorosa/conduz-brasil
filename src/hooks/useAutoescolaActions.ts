import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useAutoescolaActions() {
  const { profile } = useAuth();
  const { toast } = useToast();

  async function getInstructorProfileId(): Promise<string | null> {
    if (!profile?.id) return null;
    
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (error) {
      console.error('Error getting instructor profile:', error);
      return null;
    }

    return data?.id || null;
  }

  async function criarInstrutor(data: {
    nome: string;
    email: string;
    telefone?: string;
    categoria?: string;
  }) {
    const drivingSchoolId = await getInstructorProfileId();
    
    if (!drivingSchoolId) {
      throw new Error('Perfil de autoescola não encontrado');
    }

    const { data: newInstructor, error } = await supabase
      .from('driving_school_instructors')
      .insert({
        driving_school_id: drivingSchoolId,
        name: data.nome,
        email: data.email,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating instructor:', error);
      throw error;
    }

    return newInstructor;
  }

  async function atualizarInstrutor(id: string, data: {
    nome?: string;
    email?: string;
    telefone?: string;
    fotoPerfil?: string;
    categoria?: string;
    veiculosVinculados?: string[];
    horarios?: Record<string, any>;
  }) {
    const updateData: Record<string, any> = {};
    
    if (data.nome) updateData.name = data.nome;
    if (data.email) updateData.email = data.email;
    if (data.fotoPerfil) updateData.photo_url = data.fotoPerfil;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('driving_school_instructors')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating instructor:', error);
      throw error;
    }
  }

  async function toggleVisibilidade(id: string, visivel: boolean) {
    const { error } = await supabase
      .from('driving_school_instructors')
      .update({
        status: visivel ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error toggling visibility:', error);
      throw error;
    }
  }

  async function deletarInstrutor(id: string) {
    const { error } = await supabase
      .from('driving_school_instructors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting instructor:', error);
      throw error;
    }
  }

  async function uploadFotoInstrutor(file: File, instructorId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `instructor-${instructorId}-${Date.now()}.${fileExt}`;
    const filePath = `instructor-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  return {
    criarInstrutor,
    atualizarInstrutor,
    toggleVisibilidade,
    deletarInstrutor,
    uploadFotoInstrutor
  };
}
