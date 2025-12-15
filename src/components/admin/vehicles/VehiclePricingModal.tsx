import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Package, Info } from 'lucide-react';

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  license_category: string;
  instructor_id: string;
  pricing?: {
    id: string;
    single_class_price: number;
    package_5_price: number | null;
    package_10_price: number | null;
    package_20_price: number | null;
  }[];
}

interface VehiclePricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleData | null;
  onSaved: () => void;
}

export function VehiclePricingModal({ 
  open, 
  onOpenChange, 
  vehicle, 
  onSaved 
}: VehiclePricingModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [prices, setPrices] = useState({
    single_class_price: '',
    package_5_price: '',
    package_10_price: '',
    package_20_price: '',
  });

  useEffect(() => {
    if (vehicle?.pricing && vehicle.pricing.length > 0) {
      const pricing = vehicle.pricing[0];
      setPrices({
        single_class_price: pricing.single_class_price?.toString() || '',
        package_5_price: pricing.package_5_price?.toString() || '',
        package_10_price: pricing.package_10_price?.toString() || '',
        package_20_price: pricing.package_20_price?.toString() || '',
      });
    } else {
      setPrices({
        single_class_price: '',
        package_5_price: '',
        package_10_price: '',
        package_20_price: '',
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle) return;

    if (!prices.single_class_price) {
      toast({
        title: 'Campo obrigatório',
        description: 'Informe o preço da aula avulsa.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const pricingData = {
        instructor_id: vehicle.instructor_id,
        vehicle_id: vehicle.id,
        license_category: vehicle.license_category,
        single_class_price: parseFloat(prices.single_class_price),
        package_5_price: prices.package_5_price ? parseFloat(prices.package_5_price) : null,
        package_10_price: prices.package_10_price ? parseFloat(prices.package_10_price) : null,
        package_20_price: prices.package_20_price ? parseFloat(prices.package_20_price) : null,
        is_active: true,
      };

      if (vehicle.pricing && vehicle.pricing.length > 0) {
        // Update existing pricing
        const { error } = await supabase
          .from('pricing')
          .update(pricingData)
          .eq('id', vehicle.pricing[0].id);
        
        if (error) throw error;
      } else {
        // Create new pricing
        const { error } = await supabase
          .from('pricing')
          .insert(pricingData);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Preços salvos',
        description: 'Os preços foram atualizados com sucesso.',
      });
      
      onSaved();
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os preços.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (packagePrice: string, quantity: number) => {
    if (!prices.single_class_price || !packagePrice) return null;
    
    const singleTotal = parseFloat(prices.single_class_price) * quantity;
    const packageTotal = parseFloat(packagePrice);
    const discount = ((singleTotal - packageTotal) / singleTotal) * 100;
    
    return discount > 0 ? discount.toFixed(0) : null;
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Gerenciar Preços
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2 mt-2">
              {vehicle.brand} {vehicle.model}
              <Badge variant="outline">Cat. {vehicle.license_category}</Badge>
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Single Class Price */}
          <div className="space-y-2">
            <Label htmlFor="single_class_price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Aula Avulsa *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="single_class_price"
                type="number"
                step="0.01"
                min="0"
                value={prices.single_class_price}
                onChange={(e) => setPrices(prev => ({ ...prev, single_class_price: e.target.value }))}
                className="pl-10"
                placeholder="100.00"
                required
              />
            </div>
          </div>
          
          {/* Package Prices */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <Label>Pacotes (opcional)</Label>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              {/* 5 Classes Package */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="package_5_price">Pacote 5 Aulas</Label>
                  {calculateDiscount(prices.package_5_price, 5) && (
                    <Badge variant="secondary" className="text-green-600">
                      {calculateDiscount(prices.package_5_price, 5)}% desconto
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="package_5_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices.package_5_price}
                    onChange={(e) => setPrices(prev => ({ ...prev, package_5_price: e.target.value }))}
                    className="pl-10"
                    placeholder="450.00"
                  />
                </div>
              </div>
              
              {/* 10 Classes Package */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="package_10_price">Pacote 10 Aulas</Label>
                  {calculateDiscount(prices.package_10_price, 10) && (
                    <Badge variant="secondary" className="text-green-600">
                      {calculateDiscount(prices.package_10_price, 10)}% desconto
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="package_10_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices.package_10_price}
                    onChange={(e) => setPrices(prev => ({ ...prev, package_10_price: e.target.value }))}
                    className="pl-10"
                    placeholder="850.00"
                  />
                </div>
              </div>
              
              {/* 20 Classes Package */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="package_20_price">Pacote 20 Aulas</Label>
                  {calculateDiscount(prices.package_20_price, 20) && (
                    <Badge variant="secondary" className="text-green-600">
                      {calculateDiscount(prices.package_20_price, 20)}% desconto
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="package_20_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices.package_20_price}
                    onChange={(e) => setPrices(prev => ({ ...prev, package_20_price: e.target.value }))}
                    className="pl-10"
                    placeholder="1600.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Oferecer pacotes com desconto incentiva alunos a agendar mais aulas de uma vez.
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Preços'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
