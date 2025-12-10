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

export interface Review {
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

export const mockInstructor = {
  id: '1',
  name: 'Carlos Eduardo Silva',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  email: 'carlos.silva@email.com',
};

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    studentName: 'João Silva',
    studentPhoto: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Honda Civic 2023',
    date: '2024-12-10',
    time: '09:00',
    location: 'Centro - São Paulo',
    status: 'confirmed',
    price: 120,
    lessonsCount: 1,
  },
  {
    id: '2',
    studentName: 'Maria Santos',
    studentPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    category: 'A',
    vehicle: 'Honda CG 160',
    date: '2024-12-10',
    time: '14:00',
    location: 'Pinheiros - São Paulo',
    status: 'confirmed',
    price: 100,
    lessonsCount: 1,
  },
  {
    id: '3',
    studentName: 'Pedro Oliveira',
    studentPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Toyota Corolla 2022',
    date: '2024-12-10',
    time: '16:30',
    location: 'Vila Mariana - São Paulo',
    status: 'pending',
    price: 240,
    lessonsCount: 2,
  },
  {
    id: '4',
    studentName: 'Ana Carolina',
    studentPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Honda Civic 2023',
    date: '2024-12-11',
    time: '08:00',
    location: 'Moema - São Paulo',
    status: 'pending',
    price: 120,
    lessonsCount: 1,
  },
  {
    id: '5',
    studentName: 'Lucas Ferreira',
    studentPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    category: 'AB',
    vehicle: 'Honda Civic 2023',
    date: '2024-12-11',
    time: '10:00',
    location: 'Itaim Bibi - São Paulo',
    status: 'confirmed',
    price: 360,
    lessonsCount: 3,
  },
  {
    id: '6',
    studentName: 'Fernanda Lima',
    studentPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Toyota Corolla 2022',
    date: '2024-12-12',
    time: '15:00',
    location: 'Perdizes - São Paulo',
    status: 'pending',
    price: 120,
    lessonsCount: 1,
  },
  {
    id: '7',
    studentName: 'Ricardo Gomes',
    studentPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    category: 'A',
    vehicle: 'Honda CG 160',
    date: '2024-12-05',
    time: '11:00',
    location: 'Santana - São Paulo',
    status: 'completed',
    price: 200,
    lessonsCount: 2,
  },
  {
    id: '8',
    studentName: 'Juliana Costa',
    studentPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Honda Civic 2023',
    date: '2024-12-03',
    time: '09:30',
    location: 'Brooklin - São Paulo',
    status: 'completed',
    price: 120,
    lessonsCount: 1,
  },
  {
    id: '9',
    studentName: 'Marcos Andrade',
    studentPhoto: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Toyota Corolla 2022',
    date: '2024-12-01',
    time: '14:00',
    location: 'Centro - São Paulo',
    status: 'cancelled',
    price: 120,
    lessonsCount: 1,
  },
  {
    id: '10',
    studentName: 'Beatriz Almeida',
    studentPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Honda Civic 2023',
    date: '2024-12-13',
    time: '08:30',
    location: 'Vila Olímpia - São Paulo',
    status: 'confirmed',
    price: 480,
    lessonsCount: 4,
  },
  {
    id: '11',
    studentName: 'Gabriel Souza',
    studentPhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face',
    category: 'A',
    vehicle: 'Honda CG 160',
    date: '2024-12-14',
    time: '16:00',
    location: 'Lapa - São Paulo',
    status: 'confirmed',
    price: 100,
    lessonsCount: 1,
  },
  {
    id: '12',
    studentName: 'Camila Rocha',
    studentPhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face',
    category: 'B',
    vehicle: 'Toyota Corolla 2022',
    date: '2024-11-28',
    time: '10:00',
    location: 'Consolação - São Paulo',
    status: 'completed',
    price: 120,
    lessonsCount: 1,
  },
];

export const mockReviews: Review[] = [
  {
    id: '1',
    studentName: 'Ricardo Gomes',
    studentPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    comment: 'Excelente instrutor! Muito paciente e didático. Recomendo para quem está começando.',
    date: '2024-12-05',
  },
  {
    id: '2',
    studentName: 'Juliana Costa',
    studentPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    comment: 'Ótima aula! Me senti muito segura durante todo o percurso.',
    date: '2024-12-03',
  },
  {
    id: '3',
    studentName: 'Camila Rocha',
    studentPhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face',
    rating: 4,
    comment: 'Bom instrutor, pontual e profissional. Carro em ótimo estado.',
    date: '2024-11-28',
  },
  {
    id: '4',
    studentName: 'Bruno Mendes',
    studentPhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    comment: 'Consegui perder o medo de dirigir graças ao Carlos. Super recomendo!',
    date: '2024-11-25',
  },
  {
    id: '5',
    studentName: 'Patrícia Nunes',
    studentPhoto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face',
    rating: 4,
    comment: 'Muito atencioso e explicou bem os conceitos. Apenas pontualidade poderia melhorar.',
    date: '2024-11-20',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-12-05',
    appointmentId: '7',
    studentName: 'Ricardo Gomes',
    grossValue: 200,
    fee: 24,
    netValue: 176,
    status: 'paid',
  },
  {
    id: '2',
    date: '2024-12-03',
    appointmentId: '8',
    studentName: 'Juliana Costa',
    grossValue: 120,
    fee: 14.4,
    netValue: 105.6,
    status: 'paid',
  },
  {
    id: '3',
    date: '2024-11-28',
    appointmentId: '12',
    studentName: 'Camila Rocha',
    grossValue: 120,
    fee: 14.4,
    netValue: 105.6,
    status: 'paid',
  },
  {
    id: '4',
    date: '2024-11-25',
    appointmentId: '13',
    studentName: 'Bruno Mendes',
    grossValue: 240,
    fee: 28.8,
    netValue: 211.2,
    status: 'paid',
  },
  {
    id: '5',
    date: '2024-11-20',
    appointmentId: '14',
    studentName: 'Patrícia Nunes',
    grossValue: 120,
    fee: 14.4,
    netValue: 105.6,
    status: 'paid',
  },
  {
    id: '6',
    date: '2024-11-15',
    appointmentId: '15',
    studentName: 'Eduardo Lima',
    grossValue: 360,
    fee: 43.2,
    netValue: 316.8,
    status: 'paid',
  },
  {
    id: '7',
    date: '2024-12-10',
    appointmentId: '1',
    studentName: 'João Silva',
    grossValue: 120,
    fee: 14.4,
    netValue: 105.6,
    status: 'pending',
  },
  {
    id: '8',
    date: '2024-12-10',
    appointmentId: '2',
    studentName: 'Maria Santos',
    grossValue: 100,
    fee: 12,
    netValue: 88,
    status: 'pending',
  },
];

export const mockChartData = [
  { month: 'Jul', aulas: 15 },
  { month: 'Ago', aulas: 18 },
  { month: 'Set', aulas: 22 },
  { month: 'Out', aulas: 20 },
  { month: 'Nov', aulas: 25 },
  { month: 'Dez', aulas: 28 },
];
