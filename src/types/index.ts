// Instructor types
export interface Instructor {
  id: string;
  name: string;
  photo: string;
  isVerified: boolean;
  type: "autonomous" | "school";
  rating: number;
  totalReviews: number;
  distance: number;
  categories: string[];
  description: string;
  tags: string[];
  pricePerLesson: number;
  minPrice?: number;
}

// Vehicle types
export interface Vehicle {
  id: string;
  model: string;
  year: number;
  category: string;
  features: string[];
  photo: string;
}

// Review types
export interface Review {
  id: string;
  studentName: string;
  studentPhoto: string;
  rating: number;
  date: string;
  comment: string;
  instructorReply?: string;
}

// Instructor Profile types
export interface InstructorProfile {
  id: string;
  name: string;
  type: "autonomous" | "school";
  isVerified: boolean;
  profilePhoto: string;
  coverPhoto: string;
  categories: string[];
  rating: number;
  totalReviews: number;
  about: string;
  specialties: string[];
  vehicles: Vehicle[];
  reviews: Review[];
  location: {
    address: string;
    neighborhoods: string[];
    coordinates: { lat: number; lng: number };
  };
  pricing: {
    category: string;
    singleLesson: number;
    package5?: number;
    package10?: number;
  }[];
  stats: {
    responseTime: string;
    acceptanceRate: string;
    memberSince: string;
    documentVerified: boolean;
  };
  contact: {
    whatsapp: string;
    email: string;
  };
  availability: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

// Student lesson types
export interface StudentLesson {
  id: string;
  instructorName: string;
  instructorPhoto: string;
  instructorRating: number;
  instructorReviews: number;
  category: string;
  vehicle: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  price: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  hasReviewed: boolean;
}

// Favorite instructor types
export interface FavoriteInstructor {
  id: string;
  name: string;
  photo: string;
  rating: number;
  reviews: number;
  categories: string[];
  pricePerLesson: number;
  location: string;
}

// Admin types
export interface Appointment {
  id: string;
  studentName: string;
  studentPhoto: string;
  category: string;
  vehicle: string;
  date: string;
  time: string;
  location: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  lessonsCount: number;
}

export interface AdminReview {
  id: string;
  studentName: string;
  studentPhoto: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Transaction {
  id: string;
  date: string;
  appointmentId: string;
  studentName: string;
  grossValue: number;
  fee: number;
  netValue: number;
  status: 'pending' | 'paid' | 'processing';
}
