import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeocodeResult {
  latitude: number | null;
  longitude: number | null;
  display_name?: string;
}

export function useGeocode() {
  const [isGeocoding, setIsGeocoding] = useState(false);

  const geocodeAddress = async (
    address: string,
    instructorId?: string
  ): Promise<GeocodeResult> => {
    if (!address.trim()) {
      return { latitude: null, longitude: null };
    }

    setIsGeocoding(true);

    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { address, instructorId },
      });

      if (error) {
        console.error('Geocode error:', error);
        toast.error('Erro ao obter coordenadas do endereço');
        return { latitude: null, longitude: null };
      }

      if (data.error) {
        console.warn('Address not found:', data.error);
        return { latitude: null, longitude: null };
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        display_name: data.display_name,
      };
    } catch (error) {
      console.error('Geocode error:', error);
      toast.error('Erro ao processar endereço');
      return { latitude: null, longitude: null };
    } finally {
      setIsGeocoding(false);
    }
  };

  const buildFullAddress = (parts: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }): string => {
    const { street, number, neighborhood, city, state, zipcode } = parts;
    const addressParts = [];

    if (street) addressParts.push(street);
    if (number) addressParts.push(number);
    if (neighborhood) addressParts.push(neighborhood);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zipcode) addressParts.push(zipcode);

    return addressParts.join(', ') + ', Brasil';
  };

  return {
    geocodeAddress,
    buildFullAddress,
    isGeocoding,
  };
}
