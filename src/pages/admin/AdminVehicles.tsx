import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { VehicleCard } from '@/components/admin/vehicles/VehicleCard';
import { VehicleModal } from '@/components/admin/vehicles/VehicleModal';
import { VehiclePricingModal } from '@/components/admin/vehicles/VehiclePricingModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Car, 
  CheckCircle, 
  Award, 
  DollarSign, 
  X, 
  Loader2,
  Search,
  AlertTriangle,
  Building2,
  Users,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstructorAvatar } from '@/components/admin/InstructorAvatar';
import { format } from 'date-fns';

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vehicle_type: string;
  license_category: string;
  transmission: string;
  color: string | null;
  has_air_conditioning: boolean;
  has_power_steering: boolean;
  is_adapted: boolean;
  adaptation_type: string | null;
  is_active: boolean;
  main_photo_url: string | null;
  additional_photos: string[] | null;
  crlv_url: string | null;
  instructor_id: string;
  created_at: string;
  pricing?: {
    id: string;
    single_class_price: number;
    package_5_price: number | null;
    package_10_price: number | null;
    package_20_price: number | null;
  }[];
  total_bookings?: number;
  average_rating?: number;
}

interface AffiliatedVehicleFlat extends VehicleData {
  instructorName: string;
  instructorPhoto: string | null;
  ownerLinkedUserId: string | null;
}

export default function AdminVehicles() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [affiliatedVehicles, setAffiliatedVehicles] = useState<AffiliatedVehicleFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [isDrivingSchool, setIsDrivingSchool] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterInstructor, setFilterInstructor] = useState('all');
  const [instructorFilterOpen, setInstructorFilterOpen] = useState(false);
  
  // Modals
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleData | null>(null);
  const [editingAffiliated, setEditingAffiliated] = useState<AffiliatedVehicleFlat | null>(null);
  
  // Delete confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchVehicles();
    }
  }, [profile?.id]);

  const fetchVehicles = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // Get instructor profile
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('id, is_driving_school')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (instructorError) throw instructorError;
      
      if (!instructorData) {
        const { data: newInstructor, error: createError } = await supabase
          .from('instructor_profiles')
          .insert({
            user_id: profile.id,
            verification_status: 'pending',
            is_active: false,
          })
          .select('id, is_driving_school')
          .single();
        
        if (createError) {
          console.error('Error creating instructor profile:', createError);
          toast({ title: 'Erro', description: 'Não foi possível criar o perfil de instrutor.', variant: 'destructive' });
          setVehicles([]);
          setLoading(false);
          return;
        }
        
        setInstructorId(newInstructor.id);
        setIsDrivingSchool(newInstructor.is_driving_school ?? false);
        setVehicles([]);
        setLoading(false);
        return;
      }
      
      setInstructorId(instructorData.id);
      setIsDrivingSchool(instructorData.is_driving_school ?? false);
      
      // Fetch own vehicles with pricing
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`*, pricing (id, single_class_price, package_5_price, package_10_price, package_20_price)`)
        .eq('instructor_id', instructorData.id)
        .order('created_at', { ascending: false });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch stats
      const vehiclesWithStats = await Promise.all(
        (vehiclesData || []).map(async (vehicle) => {
          const { count: bookingsCount } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('vehicle_id', vehicle.id)
            .eq('status', 'completed');
          
          return { ...vehicle, total_bookings: bookingsCount || 0, average_rating: 0 };
        })
      );
      
      setVehicles(vehiclesWithStats);

      // If driving school, fetch affiliated instructor vehicles
      if (instructorData.is_driving_school) {
        await fetchAffiliatedVehicles(instructorData.id);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os veículos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliatedVehicles = async (schoolProfileId: string) => {
    try {
      const { data: affiliatedInstructors } = await supabase
        .from('driving_school_instructors')
        .select('id, name, photo_url, linked_user_id, profiles:linked_user_id(avatar_url)')
        .eq('driving_school_id', schoolProfileId)
        .eq('status', 'active')
        .eq('is_account_linked', true)
        .not('linked_user_id', 'is', null);

      if (!affiliatedInstructors?.length) {
        setAffiliatedVehicles([]);
        return;
      }

      const userIds = affiliatedInstructors.map(i => i.linked_user_id!).filter(Boolean);

      const { data: affiliatedProfiles } = await supabase
        .from('instructor_profiles')
        .select('id, user_id')
        .in('user_id', userIds);

      if (!affiliatedProfiles?.length) {
        setAffiliatedVehicles([]);
        return;
      }

      const userToProfile = new Map(affiliatedProfiles.map(p => [p.user_id, p.id]));

      const flat: AffiliatedVehicleFlat[] = [];

      for (const instructor of affiliatedInstructors) {
        const profileId = userToProfile.get(instructor.linked_user_id!);
        if (!profileId) continue;

        const { data: instrVehicles } = await supabase
          .from('vehicles')
          .select(`*, pricing (id, single_class_price, package_5_price, package_10_price, package_20_price)`)
          .eq('instructor_id', profileId)
          .order('created_at', { ascending: false });

        if (instrVehicles?.length) {
          const linkedAvatar = (instructor as any).profiles?.avatar_url || null;
          for (const v of instrVehicles) {
            flat.push({
              ...v,
              total_bookings: 0,
              average_rating: 0,
              instructorName: instructor.name,
              instructorPhoto: instructor.photo_url || linkedAvatar,
              ownerLinkedUserId: instructor.linked_user_id || null,
            });
          }
        }
      }

      setAffiliatedVehicles(flat);
    } catch (error) {
      console.error('Error fetching affiliated vehicles:', error);
    }
  };

  // Filtered vehicles
  const applyFilters = (vehicleList: VehicleData[]) => {
    return vehicleList.filter((vehicle) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          vehicle.brand.toLowerCase().includes(query) ||
          vehicle.model.toLowerCase().includes(query) ||
          vehicle.license_plate.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (filterCategory !== 'all' && vehicle.license_category !== filterCategory) return false;
      if (filterStatus === 'active' && !vehicle.is_active) return false;
      if (filterStatus === 'inactive' && vehicle.is_active) return false;
      return true;
    });
  };

  // Build unique affiliated instructors list for the filter
  const affiliatedInstructorOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; photo: string | null }>();
    for (const v of affiliatedVehicles) {
      const key = v.ownerLinkedUserId || v.instructorName;
      if (!map.has(key)) {
        map.set(key, { id: key, name: v.instructorName, photo: v.instructorPhoto });
      }
    }
    return Array.from(map.values());
  }, [affiliatedVehicles]);

  const filteredVehicles = useMemo(() => {
    if (filterInstructor === 'affiliated') return []; // only show affiliated
    if (filterInstructor !== 'all' && filterInstructor !== 'school') return []; // specific instructor selected
    return applyFilters(vehicles);
  }, [vehicles, searchQuery, filterCategory, filterStatus, filterInstructor]);
  
  const filteredAffiliatedVehicles = useMemo(() => {
    if (filterInstructor === 'school') return []; // only show school
    let list = affiliatedVehicles;
    if (filterInstructor !== 'all' && filterInstructor !== 'school' && filterInstructor !== 'affiliated') {
      // Specific instructor
      list = affiliatedVehicles.filter(v => (v.ownerLinkedUserId || v.instructorName) === filterInstructor);
    }
    return applyFilters(list) as AffiliatedVehicleFlat[];
  }, [affiliatedVehicles, searchQuery, filterCategory, filterStatus, filterInstructor]);

  const allVehiclesCount = vehicles.length + affiliatedVehicles.length;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterInstructor('all');
  };

  const calculateAveragePrice = () => {
    if (vehicles.length === 0) return '0';
    const prices = vehicles
      .filter(v => v.pricing && v.pricing.length > 0 && v.pricing[0].single_class_price)
      .map(v => v.pricing![0].single_class_price);
    if (prices.length === 0) return '0';
    return (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(0);
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleModalOpen(true);
  };

  const handleEditVehicle = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setVehicleModalOpen(true);
  };

  const handleToggleStatus = async (vehicle: VehicleData) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: !vehicle.is_active })
        .eq('id', vehicle.id);
      if (error) throw error;
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, is_active: !v.is_active } : v));
      toast({
        title: 'Status atualizado',
        description: vehicle.is_active ? 'Veículo desativado com sucesso' : 'Veículo ativado com sucesso',
      });
    } catch (error) {
      console.error('Error toggling vehicle status:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status do veículo.', variant: 'destructive' });
    }
  };

  const handleDeleteVehicle = (vehicle: VehicleData) => {
    setVehicleToDelete(vehicle);
    setDeleteConfirmText('');
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setDeleting(true);
    try {
      const { data: futureBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicleToDelete.id)
        .gte('scheduled_date', format(new Date(), 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);
      
      if (futureBookings && futureBookings.length > 0) {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled', cancellation_reason: 'Veículo não está mais disponível' })
          .in('id', futureBookings.map(b => b.id));
      }
      
      await supabase.from('pricing').delete().eq('vehicle_id', vehicleToDelete.id);
      
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicleToDelete.id)
        .limit(1);
      
      if (allBookings && allBookings.length > 0) {
        const { error } = await supabase.from('vehicles').update({ is_active: false }).eq('id', vehicleToDelete.id);
        if (error) throw error;
        setVehicles(prev => prev.map(v => v.id === vehicleToDelete.id ? { ...v, is_active: false } : v));
        toast({ title: 'Veículo desativado', description: 'O veículo foi desativado pois possui histórico de agendamentos.' });
      } else {
        await supabase.from('pricing').delete().eq('vehicle_id', vehicleToDelete.id);
        const { error } = await supabase.from('vehicles').delete().eq('id', vehicleToDelete.id);
        if (error) throw error;
        setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id));
        toast({ title: 'Veículo excluído', description: 'O veículo foi removido com sucesso.' });
      }
      
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
      setVehicleToDelete(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir o veículo.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleManagePricing = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setPricingModalOpen(true);
  };

  const handleVehicleSaved = () => {
    setVehicleModalOpen(false);
    setSelectedVehicle(null);
    setEditingAffiliated(null);
    fetchVehicles();
  };

  const handleAffiliatedSave = async (vehicleData: Record<string, any>) => {
    if (!editingAffiliated) return;
    
    const { data, error } = await supabase.rpc('update_affiliated_vehicle', {
      p_vehicle_id: editingAffiliated.id,
      p_brand: vehicleData.brand,
      p_model: vehicleData.model,
      p_year: vehicleData.year,
      p_license_plate: vehicleData.license_plate,
      p_color: vehicleData.color,
      p_vehicle_type: vehicleData.vehicle_type,
      p_license_category: vehicleData.license_category,
      p_transmission: vehicleData.transmission,
      p_has_air_conditioning: vehicleData.has_air_conditioning,
      p_has_power_steering: vehicleData.has_power_steering,
      p_is_adapted: vehicleData.is_adapted,
      p_adaptation_type: vehicleData.adaptation_type,
      p_main_photo_url: vehicleData.main_photo_url,
    });

    if (error) throw error;
    
    const result = data as any;
    if (!result?.success) {
      throw new Error(result?.error || 'Erro ao atualizar veículo');
    }

    // Notify the affiliated instructor
    if (editingAffiliated.ownerLinkedUserId) {
      try {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: editingAffiliated.ownerLinkedUserId,
          type: 'vehicle_edited_by_school',
          title: 'Veículo editado pela autoescola',
          message: `A autoescola editou seu veículo ${vehicleData.brand} ${vehicleData.model} (${vehicleData.license_plate}).`,
          action_url: '/admin/veiculos',
        });
        if (notifError) {
          console.error('Erro ao notificar instrutor (veículo edit):', notifError);
        }
      } catch (notifyErr) {
        console.error('Falha na notificação de edição de veículo:', notifyErr);
      }
    }
  };

  const handleEditAffiliatedVehicle = (vehicle: AffiliatedVehicleFlat) => {
    setEditingAffiliated(vehicle);
    setSelectedVehicle(vehicle);
    setVehicleModalOpen(true);
  };

  const handleToggleAffiliatedStatus = async (vehicle: AffiliatedVehicleFlat) => {
    try {
      const { data, error } = await supabase.rpc('update_affiliated_vehicle', {
        p_vehicle_id: vehicle.id,
        p_is_active: !vehicle.is_active,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);

      // Notify instructor
      if (vehicle.ownerLinkedUserId) {
        try {
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: vehicle.ownerLinkedUserId,
            type: 'vehicle_edited_by_school',
            title: 'Status de veículo alterado',
            message: `A autoescola ${vehicle.is_active ? 'desativou' : 'ativou'} seu veículo ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate}).`,
            action_url: '/admin/veiculos',
          });
          if (notifError) {
            console.error('Erro ao notificar instrutor (veículo status):', notifError);
          }
        } catch (notifyErr) {
          console.error('Falha na notificação de status de veículo:', notifyErr);
        }
      }

      toast({
        title: 'Status atualizado',
        description: vehicle.is_active ? 'Veículo desativado com sucesso' : 'Veículo ativado com sucesso',
      });
      fetchVehicles();
    } catch (error) {
      console.error('Error toggling affiliated vehicle status:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status do veículo.', variant: 'destructive' });
    }
  };

  const handlePricingSaved = () => {
    setPricingModalOpen(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  const hasFilters = searchQuery || filterCategory !== 'all' || filterStatus !== 'all' || filterInstructor !== 'all';

  // Resolve label for selected instructor filter
  const selectedInstructorLabel = useMemo(() => {
    if (filterInstructor === 'all') return null;
    if (filterInstructor === 'school') return { label: 'Autoescola', icon: 'school' as const };
    if (filterInstructor === 'affiliated') return { label: 'Filiados', icon: 'users' as const };
    const found = affiliatedInstructorOptions.find(i => i.id === filterInstructor);
    if (found) return { label: found.name, photo: found.photo, icon: 'instructor' as const };
    return null;
  }, [filterInstructor, affiliatedInstructorOptions]);

  

  return (
    <div className="p-6 md:p-8">
      <Breadcrumbs />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-instructor-text-primary">Meus Veículos</h1>
          <p className="text-instructor-text-secondary mt-1">
            Gerencie os veículos disponíveis para suas aulas
          </p>
        </div>
        
        <Button onClick={handleAddVehicle} className="gap-2">
          <Plus className="w-5 h-5" />
          Adicionar Veículo
        </Button>
      </div>
      
      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-instructor-text-secondary">Total de Veículos</p>
              <Car className="w-5 h-5 text-instructor-accent" />
            </div>
            <p className="text-2xl font-bold text-instructor-text-primary">{allVehiclesCount}</p>
          </div>
          
          <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-instructor-text-secondary">Ativos</p>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-instructor-text-primary">
              {vehicles.filter(v => v.is_active).length}
            </p>
          </div>
          
          <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-instructor-text-secondary">Categorias</p>
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-instructor-text-primary">
              {new Set(vehicles.map(v => v.license_category)).size}
            </p>
          </div>
          
          <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-instructor-text-secondary">Preço Médio</p>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-instructor-text-primary">
              R$ {calculateAveragePrice()}
            </p>
          </div>
        </div>
      )}

      {/* Vehicle pricing alert banner */}
      {!loading && (() => {
        const vehiclesSemPreco = vehicles.filter(
          v => v.is_active && (!v.pricing || v.pricing.length === 0 || !v.pricing[0].single_class_price)
        );
        if (vehiclesSemPreco.length === 0) return null;
        return (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Veículos sem preço definido</p>
              <p className="text-xs text-muted-foreground">
                {vehiclesSemPreco.length} veículo(s) não tem valores de aula configurados.
                Configure os preços para que alunos possam agendar.
              </p>
            </div>
          </div>
        );
      })()}
      
      {/* Filters */}
      <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-instructor-text-muted" />
            <Input
              type="text"
              placeholder="Buscar veículo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary placeholder:text-instructor-text-muted"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary">
              <SelectValue placeholder="Todas Categorias" />
            </SelectTrigger>
            <SelectContent className="bg-instructor-dark-tertiary border-white/10">
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="A">Cat. A (Moto)</SelectItem>
              <SelectItem value="B">Cat. B (Carro)</SelectItem>
              <SelectItem value="AB">Cat. AB</SelectItem>
              <SelectItem value="C">Cat. C</SelectItem>
              <SelectItem value="D">Cat. D</SelectItem>
              <SelectItem value="E">Cat. E</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary">
              <SelectValue placeholder="Todos Status" />
            </SelectTrigger>
            <SelectContent className="bg-instructor-dark-tertiary border-white/10">
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Instructor filter combobox — only for driving schools */}
          {isDrivingSchool && (
            <Popover open={instructorFilterOpen} onOpenChange={setInstructorFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={instructorFilterOpen}
                  className="w-[220px] justify-between bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary hover:bg-white/10 hover:text-instructor-text-primary"
                >
                  <div className="flex items-center gap-2 truncate">
                    {selectedInstructorLabel ? (
                      selectedInstructorLabel.icon === 'school' ? (
                        <>
                          <Building2 className="w-4 h-4 shrink-0 text-primary" />
                          <span className="truncate">{selectedInstructorLabel.label}</span>
                        </>
                      ) : selectedInstructorLabel.icon === 'users' ? (
                        <>
                          <Users className="w-4 h-4 shrink-0 text-blue-400" />
                          <span className="truncate">{selectedInstructorLabel.label}</span>
                        </>
                      ) : (
                        <>
                          <InstructorAvatar photoUrl={selectedInstructorLabel.photo} name={selectedInstructorLabel.label} size="sm" />
                          <span className="truncate">{selectedInstructorLabel.label}</span>
                        </>
                      )
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-instructor-text-muted shrink-0" />
                        <span className="truncate">Todos instrutores</span>
                      </>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0 bg-instructor-dark-secondary border-white/10 z-50">
                <Command className="bg-transparent">
                  <CommandInput placeholder="Buscar..." className="text-instructor-text-primary" />
                  <CommandList>
                    <CommandEmpty className="text-instructor-text-muted text-sm py-4 text-center">Nenhum resultado</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { setFilterInstructor('all'); setInstructorFilterOpen(false); }}
                        className="text-instructor-text-primary hover:bg-white/10"
                      >
                        <Users className="w-4 h-4 mr-2 text-instructor-text-muted" />
                        <span>Todos instrutores</span>
                        {filterInstructor === 'all' && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </CommandItem>
                      <CommandItem
                        value="school"
                        onSelect={() => { setFilterInstructor('school'); setInstructorFilterOpen(false); }}
                        className="text-instructor-text-primary hover:bg-white/10"
                      >
                        <Building2 className="w-4 h-4 mr-2 text-primary" />
                        <span>Autoescola</span>
                        {filterInstructor === 'school' && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </CommandItem>
                      <CommandItem
                        value="affiliated"
                        onSelect={() => { setFilterInstructor('affiliated'); setInstructorFilterOpen(false); }}
                        className="text-instructor-text-primary hover:bg-white/10"
                      >
                        <Users className="w-4 h-4 mr-2 text-blue-400" />
                        <span>Filiados</span>
                        {filterInstructor === 'affiliated' && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </CommandItem>
                    </CommandGroup>
                    {affiliatedInstructorOptions.length > 0 && (
                      <>
                        <CommandSeparator className="bg-white/10" />
                        <CommandGroup heading="Instrutores">
                          {affiliatedInstructorOptions.map(inst => (
                            <CommandItem
                              key={inst.id}
                              value={inst.name}
                              onSelect={() => { setFilterInstructor(inst.id); setInstructorFilterOpen(false); }}
                              className="text-instructor-text-primary hover:bg-white/10"
                            >
                              <InstructorAvatar photoUrl={inst.photo} name={inst.name} size="sm" className="mr-2" />
                              <span>{inst.name}</span>
                              {filterInstructor === inst.id && <Check className="ml-auto h-4 w-4 text-primary" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="gap-2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>
      
      {/* Vehicles List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-instructor-accent" />
        </div>
      ) : filteredVehicles.length === 0 && filteredAffiliatedVehicles.length === 0 ? (
        <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-12 text-center">
          <Car className="w-16 h-16 text-instructor-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold text-instructor-text-primary mb-2">
            {allVehiclesCount === 0 ? 'Nenhum veículo cadastrado' : 'Nenhum veículo encontrado'}
          </h3>
          <p className="text-instructor-text-secondary mb-6">
            {allVehiclesCount === 0 
              ? 'Adicione seu primeiro veículo para começar a receber solicitações de aulas'
              : 'Tente ajustar os filtros de busca'
            }
          </p>
          {allVehiclesCount === 0 && (
            <Button onClick={handleAddVehicle} className="gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Veículo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* School's own vehicles */}
          {(filteredVehicles.length > 0 || !isDrivingSchool) && (
            <div>
              {isDrivingSchool && (
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-instructor-text-primary">Veículos da Autoescola</h2>
                  <span className="text-sm text-muted-foreground">({filteredVehicles.length})</span>
                </div>
              )}
              {filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onEdit={() => handleEditVehicle(vehicle)}
                      onToggleStatus={() => handleToggleStatus(vehicle)}
                      onDelete={() => handleDeleteVehicle(vehicle)}
                      onManagePricing={() => handleManagePricing(vehicle)}
                    />
                  ))}
                </div>
              ) : isDrivingSchool ? (
                <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-6 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum veículo próprio encontrado</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Affiliated instructor vehicles — consolidated */}
          {filteredAffiliatedVehicles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-instructor-text-primary">Veículos de Filiados</h2>
                <span className="text-sm text-muted-foreground">({filteredAffiliatedVehicles.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAffiliatedVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    ownerName={vehicle.instructorName}
                    ownerPhoto={vehicle.instructorPhoto ?? undefined}
                    onEdit={() => handleEditAffiliatedVehicle(vehicle)}
                    onToggleStatus={() => handleToggleAffiliatedStatus(vehicle)}
                    onManagePricing={() => handleManagePricing(vehicle)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Add/Edit Vehicle Modal */}
      <VehicleModal
        open={vehicleModalOpen}
        onOpenChange={(open) => {
          setVehicleModalOpen(open);
          if (!open) setEditingAffiliated(null);
        }}
        vehicle={selectedVehicle}
        instructorId={instructorId}
        onSaved={handleVehicleSaved}
        isAffiliated={!!editingAffiliated}
        onAffiliatedSaved={handleAffiliatedSave}
      />
      
      {/* Pricing Modal */}
      <VehiclePricingModal
        open={pricingModalOpen}
        onOpenChange={setPricingModalOpen}
        vehicle={selectedVehicle}
        onSaved={handlePricingSaved}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Excluir Veículo
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium mb-2">⚠️ Atenção!</p>
              <ul className="text-xs text-destructive/80 space-y-1">
                <li>• O veículo <strong>{vehicleToDelete?.brand} {vehicleToDelete?.model}</strong> será permanentemente excluído</li>
                <li>• Agendamentos futuros com este veículo serão cancelados</li>
                <li>• O histórico de aulas será mantido</li>
                <li>• Esta ação não pode ser desfeita</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Digite "<strong>{vehicleToDelete?.license_plate}</strong>" para confirmar
              </label>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder={vehicleToDelete?.license_plate}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            
            <Button
              variant="destructive"
              onClick={confirmDeleteVehicle}
              disabled={deleteConfirmText !== vehicleToDelete?.license_plate || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
