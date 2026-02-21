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
  AlertTriangle
} from 'lucide-react';
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

export default function AdminVehicles() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleData | null>(null);
  
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
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (instructorError) throw instructorError;
      
      // If no instructor profile exists yet, create one automatically
      if (!instructorData) {
        const { data: newInstructor, error: createError } = await supabase
          .from('instructor_profiles')
          .insert({
            user_id: profile.id,
            verification_status: 'pending',
            is_active: false,
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating instructor profile:', createError);
          toast({
            title: 'Erro',
            description: 'Não foi possível criar o perfil de instrutor.',
            variant: 'destructive',
          });
          setVehicles([]);
          setLoading(false);
          return;
        }
        
        setInstructorId(newInstructor.id);
        setVehicles([]);
        setLoading(false);
        return;
      }
      
      setInstructorId(instructorData.id);
      
      // Fetch vehicles with pricing
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          pricing (
            id,
            single_class_price,
            package_5_price,
            package_10_price,
            package_20_price
          )
        `)
        .eq('instructor_id', instructorData.id)
        .order('created_at', { ascending: false });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch stats for each vehicle
      const vehiclesWithStats = await Promise.all(
        (vehiclesData || []).map(async (vehicle) => {
          // Get completed bookings count
          const { count: bookingsCount } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('vehicle_id', vehicle.id)
            .eq('status', 'completed');
          
          // Get average vehicle rating from reviews
          const { data: bookingsWithReviews } = await supabase
            .from('bookings')
            .select('id')
            .eq('vehicle_id', vehicle.id)
            .eq('status', 'completed');
          
          let avgRating = 0;
          if (bookingsWithReviews && bookingsWithReviews.length > 0) {
            const bookingIds = bookingsWithReviews.map(b => b.id);
            const { data: reviews } = await supabase
              .from('reviews')
              .select('vehicle_rating')
              .in('booking_id', bookingIds)
              .not('vehicle_rating', 'is', null);
            
            if (reviews && reviews.length > 0) {
              avgRating = reviews.reduce((sum, r) => sum + (r.vehicle_rating || 0), 0) / reviews.length;
            }
          }
          
          return {
            ...vehicle,
            total_bookings: bookingsCount || 0,
            average_rating: avgRating
          };
        })
      );
      
      setVehicles(vehiclesWithStats);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os veículos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered vehicles with useMemo
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          vehicle.brand.toLowerCase().includes(query) ||
          vehicle.model.toLowerCase().includes(query) ||
          vehicle.license_plate.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (filterCategory !== 'all' && vehicle.license_category !== filterCategory) {
        return false;
      }
      
      // Status filter
      if (filterStatus === 'active' && !vehicle.is_active) return false;
      if (filterStatus === 'inactive' && vehicle.is_active) return false;
      
      return true;
    });
  }, [vehicles, searchQuery, filterCategory, filterStatus]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStatus('all');
  };

  const calculateAveragePrice = () => {
    if (vehicles.length === 0) return '0';
    
    const prices = vehicles
      .filter(v => v.pricing && v.pricing.length > 0 && v.pricing[0].single_class_price)
      .map(v => v.pricing![0].single_class_price);
    
    if (prices.length === 0) return '0';
    
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return avg.toFixed(0);
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
      
      setVehicles(prev => 
        prev.map(v => 
          v.id === vehicle.id ? { ...v, is_active: !v.is_active } : v
        )
      );
      
      toast({
        title: 'Status atualizado',
        description: vehicle.is_active 
          ? 'Veículo desativado com sucesso' 
          : 'Veículo ativado com sucesso',
      });
    } catch (error) {
      console.error('Error toggling vehicle status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do veículo.',
        variant: 'destructive',
      });
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
      // Check for future bookings
      const { data: futureBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicleToDelete.id)
        .gte('scheduled_date', format(new Date(), 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);
      
      if (futureBookings && futureBookings.length > 0) {
        // Cancel future bookings
        await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            cancellation_reason: 'Veículo não está mais disponível'
          })
          .in('id', futureBookings.map(b => b.id));
      }
      
      // Delete pricing records
      await supabase
        .from('pricing')
        .delete()
        .eq('vehicle_id', vehicleToDelete.id);
      
      // Check for any past bookings (completed, cancelled, etc.)
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicleToDelete.id)
        .limit(1);
      
      if (allBookings && allBookings.length > 0) {
        // Soft-delete: deactivate instead of deleting to preserve booking history
        const { error } = await supabase
          .from('vehicles')
          .update({ is_active: false })
          .eq('id', vehicleToDelete.id);
        
        if (error) throw error;
        
        setVehicles(prev => 
          prev.map(v => v.id === vehicleToDelete.id ? { ...v, is_active: false } : v)
        );
        
        toast({
          title: 'Veículo desativado',
          description: 'O veículo foi desativado pois possui histórico de agendamentos.',
        });
      } else {
        // Hard delete when no bookings exist
        // Delete pricing records first
        await supabase
          .from('pricing')
          .delete()
          .eq('vehicle_id', vehicleToDelete.id);
        
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', vehicleToDelete.id);
        
        if (error) throw error;
        
        setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id));
        
        toast({
          title: 'Veículo excluído',
          description: 'O veículo foi removido com sucesso.',
        });
      }
      
      // Close modal
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
      setVehicleToDelete(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o veículo.',
        variant: 'destructive',
      });
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
    fetchVehicles();
  };

  const handlePricingSaved = () => {
    setPricingModalOpen(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  const hasFilters = searchQuery || filterCategory !== 'all' || filterStatus !== 'all';

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
            <p className="text-2xl font-bold text-instructor-text-primary">{vehicles.length}</p>
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
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-12 text-center">
          <Car className="w-16 h-16 text-instructor-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold text-instructor-text-primary mb-2">
            {vehicles.length === 0 ? 'Nenhum veículo cadastrado' : 'Nenhum veículo encontrado'}
          </h3>
          <p className="text-instructor-text-secondary mb-6">
            {vehicles.length === 0 
              ? 'Adicione seu primeiro veículo para começar a receber solicitações de aulas'
              : 'Tente ajustar os filtros de busca'
            }
          </p>
          {vehicles.length === 0 && (
            <Button onClick={handleAddVehicle} className="gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Veículo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      )}
      
      {/* Add/Edit Vehicle Modal */}
      <VehicleModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        vehicle={selectedVehicle}
        instructorId={instructorId}
        onSaved={handleVehicleSaved}
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
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteConfirmText('');
              }}
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
