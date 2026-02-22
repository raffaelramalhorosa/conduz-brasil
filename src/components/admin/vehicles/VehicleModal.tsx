import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, ImagePlus, Trash2, Star } from "lucide-react";

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
}

interface VehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleData | null;
  instructorId: string | null;
  onSaved: () => void;
  isAffiliated?: boolean;
  onAffiliatedSaved?: (vehicleData: Record<string, any>) => Promise<void>;
}

const vehicleTypes = [
  { value: "car", label: "Carro" },
  { value: "motorcycle", label: "Moto" },
  { value: "truck", label: "Caminhão" },
  { value: "bus", label: "Ônibus" },
];

const categories = [
  { value: "A", label: "A - Moto" },
  { value: "B", label: "B - Carro" },
  { value: "C", label: "C - Caminhão" },
  { value: "D", label: "D - Ônibus" },
  { value: "E", label: "E - Carreta" },
];

const transmissions = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automático" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

const MAX_PHOTOS = 5;

export function VehicleModal({ open, onOpenChange, vehicle, instructorId, onSaved, isAffiliated, onAffiliatedSaved }: VehicleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: currentYear,
    license_plate: "",
    vehicle_type: "car",
    license_category: "B",
    transmission: "manual",
    color: "",
    has_air_conditioning: false,
    has_power_steering: false,
    is_adapted: false,
    adaptation_type: "",
  });

  const [mainPhotoUrl, setMainPhotoUrl] = useState<string | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        license_plate: vehicle.license_plate,
        vehicle_type: vehicle.vehicle_type,
        license_category: vehicle.license_category,
        transmission: vehicle.transmission,
        color: vehicle.color || "",
        has_air_conditioning: vehicle.has_air_conditioning,
        has_power_steering: vehicle.has_power_steering,
        is_adapted: vehicle.is_adapted,
        adaptation_type: vehicle.adaptation_type || "",
      });
      setMainPhotoUrl(vehicle.main_photo_url);
      setAdditionalPhotos(vehicle.additional_photos || []);
    } else {
      setFormData({
        brand: "",
        model: "",
        year: currentYear,
        license_plate: "",
        vehicle_type: "car",
        license_category: "B",
        transmission: "manual",
        color: "",
        has_air_conditioning: false,
        has_power_steering: false,
        is_adapted: false,
        adaptation_type: "",
      });
      setMainPhotoUrl(null);
      setAdditionalPhotos([]);
    }
  }, [vehicle, open]);

  const handlePhotoUpload = async (file: File) => {
    if (!instructorId) return null;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("vehicle-photos").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da foto.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalPhotos = (mainPhotoUrl ? 1 : 0) + additionalPhotos.length;
    const remainingSlots = MAX_PHOTOS - totalPhotos;

    if (remainingSlots <= 0) {
      toast({
        title: "Limite atingido",
        description: `Você pode adicionar no máximo ${MAX_PHOTOS} fotos.`,
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Arquivo inválido",
          description: "Apenas imagens são permitidas.",
          variant: "destructive",
        });
        continue;
      }

      const url = await handlePhotoUpload(file);
      if (url) {
        if (!mainPhotoUrl) {
          setMainPhotoUrl(url);
        } else {
          setAdditionalPhotos((prev) => [...prev, url]);
        }
      }
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSetAsMain = (photoUrl: string) => {
    if (mainPhotoUrl) {
      setAdditionalPhotos((prev) => [...prev.filter((p) => p !== photoUrl), mainPhotoUrl]);
    } else {
      setAdditionalPhotos((prev) => prev.filter((p) => p !== photoUrl));
    }
    setMainPhotoUrl(photoUrl);
  };

  const handleRemovePhoto = async (photoUrl: string, isMain: boolean) => {
    if (isMain) {
      if (additionalPhotos.length > 0) {
        setMainPhotoUrl(additionalPhotos[0]);
        setAdditionalPhotos((prev) => prev.slice(1));
      } else {
        setMainPhotoUrl(null);
      }
    } else {
      setAdditionalPhotos((prev) => prev.filter((p) => p !== photoUrl));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instructorId) {
      toast({
        title: "Erro",
        description: "Instrutor não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.brand || !formData.model || !formData.license_plate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        license_plate: formData.license_plate.toUpperCase(),
        vehicle_type: formData.vehicle_type,
        license_category: formData.license_category,
        transmission: formData.transmission,
        color: formData.color || null,
        has_air_conditioning: formData.has_air_conditioning,
        has_power_steering: formData.has_power_steering,
        is_adapted: formData.is_adapted,
        adaptation_type: formData.is_adapted ? formData.adaptation_type : null,
        instructor_id: instructorId,
        main_photo_url: mainPhotoUrl,
        additional_photos: additionalPhotos.length > 0 ? additionalPhotos : null,
      };

      if (vehicle) {
        if (isAffiliated && onAffiliatedSaved) {
          // Use RPC for affiliated vehicles
          await onAffiliatedSaved(vehicleData);
        } else {
          // Update existing vehicle directly
          const { error } = await supabase.from("vehicles").update(vehicleData).eq("id", vehicle.id);
          if (error) throw error;
        }

        toast({
          title: "Veículo atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Create new vehicle
        const { error } = await supabase.from("vehicles").insert(vehicleData);

        if (error) throw error;

        toast({
          title: "Veículo adicionado",
          description: "O veículo foi cadastrado com sucesso.",
        });
      }

      onSaved();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o veículo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!vehicle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Veículo" : "Adicionar Veículo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="Ex: Volkswagen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Ex: Gol"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Select
                value={String(formData.year)}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, year: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_plate">Placa *</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => setFormData((prev) => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                placeholder="ABC-1234"
                maxLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="Ex: Branco"
              />
            </div>
          </div>

          {/* Vehicle Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Veículo *</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicle_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria CNH *</Label>
              <Select
                value={formData.license_category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, license_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Câmbio *</Label>
              <Select
                value={formData.transmission}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, transmission: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transmissions.map((trans) => (
                    <SelectItem key={trans.value} value={trans.value}>
                      {trans.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Fotos do Veículo</Label>
              <span className="text-xs text-muted-foreground">
                {(mainPhotoUrl ? 1 : 0) + additionalPhotos.length}/{MAX_PHOTOS} fotos
              </span>
            </div>

            {/* Photo Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Main Photo */}
              {mainPhotoUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary group">
                  <img src={mainPhotoUrl} alt="Foto principal" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Principal
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(mainPhotoUrl, true)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Additional Photos */}
              {additionalPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden border border-border group"
                >
                  <img src={photo} alt={`Foto ${index + 2}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAsMain(photo)}
                      className="bg-primary text-primary-foreground p-1.5 rounded-full"
                      title="Definir como principal"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo, false)}
                      className="bg-destructive text-destructive-foreground p-1.5 rounded-full"
                      title="Remover"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload Button */}
              {(mainPhotoUrl ? 1 : 0) + additionalPhotos.length < MAX_PHOTOS && (
                <label className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-xs">Adicionar foto</span>
                    </>
                  )}
                </label>
              )}
            </div>

            {!mainPhotoUrl && additionalPhotos.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Adicione fotos do seu veículo para atrair mais alunos. A primeira foto será a principal.
              </p>
            )}
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label>Características</Label>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_air_conditioning"
                  checked={formData.has_air_conditioning}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, has_air_conditioning: checked === true }))
                  }
                />
                <label htmlFor="has_air_conditioning" className="text-sm cursor-pointer">
                  Ar Condicionado
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_power_steering"
                  checked={formData.has_power_steering}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, has_power_steering: checked === true }))
                  }
                />
                <label htmlFor="has_power_steering" className="text-sm cursor-pointer">
                  Direção Hidráulica
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_adapted"
                  checked={formData.is_adapted}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_adapted: checked === true }))}
                />
                <label htmlFor="is_adapted" className="text-sm cursor-pointer">
                  Veículo Adaptado (PCD)
                </label>
              </div>
            </div>

            {formData.is_adapted && (
              <div className="space-y-2">
                <Label htmlFor="adaptation_type">Tipo de Adaptação</Label>
                <Input
                  id="adaptation_type"
                  value={formData.adaptation_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adaptation_type: e.target.value }))}
                  placeholder="Ex: Acelerador e freio manual"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Adicionar Veículo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
