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

export const mockStudent = {
  id: '1',
  name: 'João Silva',
  email: 'joao.silva@email.com',
  photo: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=150&h=150&fit=crop&crop=face',
};

export const mockStudentLessons: StudentLesson[] = [
  {
    id: '1',
    instructorName: 'Carlos Eduardo Silva',
    instructorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.8,
    instructorReviews: 127,
    category: 'B',
    vehicle: 'Honda Civic 2023 (Automático)',
    date: '2024-12-12',
    time: '14:00',
    duration: 1,
    location: 'Rua XV de Novembro, 123 - Centro, São Paulo',
    price: 120,
    status: 'confirmed',
    hasReviewed: false,
  },
  {
    id: '2',
    instructorName: 'Ana Paula Mendes',
    instructorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.9,
    instructorReviews: 89,
    category: 'B',
    vehicle: 'Toyota Corolla 2022',
    date: '2024-12-15',
    time: '09:00',
    duration: 2,
    location: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
    price: 220,
    status: 'confirmed',
    hasReviewed: false,
  },
  {
    id: '3',
    instructorName: 'Roberto Almeida',
    instructorPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.7,
    instructorReviews: 56,
    category: 'A',
    vehicle: 'Honda CG 160',
    date: '2024-12-18',
    time: '16:00',
    duration: 1,
    location: 'Rua Augusta, 500 - Consolação, São Paulo',
    price: 100,
    status: 'pending',
    hasReviewed: false,
  },
  {
    id: '4',
    instructorName: 'Mariana Costa',
    instructorPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.6,
    instructorReviews: 42,
    category: 'B',
    vehicle: 'Volkswagen Polo 2023',
    date: '2024-12-20',
    time: '11:00',
    duration: 1,
    location: 'Rua Oscar Freire, 200 - Jardins, São Paulo',
    price: 130,
    status: 'pending',
    hasReviewed: false,
  },
  {
    id: '5',
    instructorName: 'Carlos Eduardo Silva',
    instructorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.8,
    instructorReviews: 127,
    category: 'B',
    vehicle: 'Honda Civic 2023 (Automático)',
    date: '2024-12-05',
    time: '14:00',
    duration: 1,
    location: 'Rua XV de Novembro, 123 - Centro, São Paulo',
    price: 120,
    status: 'completed',
    hasReviewed: true,
  },
  {
    id: '6',
    instructorName: 'Ana Paula Mendes',
    instructorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.9,
    instructorReviews: 89,
    category: 'B',
    vehicle: 'Toyota Corolla 2022',
    date: '2024-12-01',
    time: '10:00',
    duration: 2,
    location: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
    price: 220,
    status: 'completed',
    hasReviewed: false,
  },
  {
    id: '7',
    instructorName: 'Roberto Almeida',
    instructorPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.7,
    instructorReviews: 56,
    category: 'A',
    vehicle: 'Honda CG 160',
    date: '2024-11-28',
    time: '15:00',
    duration: 1,
    location: 'Rua Augusta, 500 - Consolação, São Paulo',
    price: 100,
    status: 'completed',
    hasReviewed: true,
  },
  {
    id: '8',
    instructorName: 'Fernanda Lima',
    instructorPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    instructorRating: 4.5,
    instructorReviews: 34,
    category: 'B',
    vehicle: 'Chevrolet Onix 2023',
    date: '2024-11-20',
    time: '08:00',
    duration: 1,
    location: 'Rua da Consolação, 1500 - Consolação, São Paulo',
    price: 110,
    status: 'completed',
    hasReviewed: false,
  },
];

export const mockFavoriteInstructors: FavoriteInstructor[] = [
  {
    id: '1',
    name: 'Carlos Eduardo Silva',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    reviews: 127,
    categories: ['B'],
    pricePerLesson: 120,
    location: 'Centro, São Paulo',
  },
  {
    id: '2',
    name: 'Ana Paula Mendes',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    rating: 4.9,
    reviews: 89,
    categories: ['B', 'AB'],
    pricePerLesson: 110,
    location: 'Bela Vista, São Paulo',
  },
  {
    id: '3',
    name: 'Roberto Almeida',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 4.7,
    reviews: 56,
    categories: ['A', 'B'],
    pricePerLesson: 100,
    location: 'Consolação, São Paulo',
  },
  {
    id: '4',
    name: 'Mariana Costa',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 4.6,
    reviews: 42,
    categories: ['B'],
    pricePerLesson: 130,
    location: 'Jardins, São Paulo',
  },
];
