export interface InstrutorNoMapa {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  latitude: number;
  longitude: number;
  average_rating: number;
  total_reviews: number;
  is_online: boolean;
  distance_km: number;
  categories: string[];
}

export interface FiltrosMapa {
  raioKm: number;
  minRating: number;
  categorias: string[];
  apenasOnline: boolean;
}

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
}
