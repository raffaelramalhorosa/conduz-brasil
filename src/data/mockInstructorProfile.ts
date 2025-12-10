export interface Vehicle {
  id: string;
  model: string;
  year: number;
  category: string;
  features: string[];
  photo: string;
}

export interface Review {
  id: string;
  studentName: string;
  studentPhoto: string;
  rating: number;
  date: string;
  comment: string;
  instructorReply?: string;
}

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
    basePrice: number;
    serviceFee: number;
  };
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
    [date: string]: string[]; // date -> available time slots
  };
}

export const mockInstructorProfile: InstructorProfile = {
  id: "1",
  name: "Carlos Eduardo Silva",
  type: "autonomous",
  isVerified: true,
  profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
  coverPhoto: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=300&fit=crop",
  categories: ["B", "AB"],
  rating: 4.8,
  totalReviews: 127,
  about: "Sou instrutor de trânsito há mais de 10 anos, especializado em alunos que enfrentam ansiedade ao dirigir. Minha metodologia foca em criar um ambiente seguro e acolhedor, trabalhando no ritmo de cada aluno. Já ajudei centenas de pessoas a conquistarem sua habilitação e a confiança necessária para dirigir com segurança.",
  specialties: [
    "Especialista em alunos ansiosos",
    "Preparação para prova prática",
    "Direção defensiva",
    "Estacionamento e manobras",
    "Direção em rodovias",
  ],
  vehicles: [
    {
      id: "v1",
      model: "Honda Civic 2022",
      year: 2022,
      category: "B",
      features: ["Automático", "Ar-condicionado", "Câmera de ré"],
      photo: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop",
    },
    {
      id: "v2",
      model: "Toyota Corolla 2021",
      year: 2021,
      category: "B",
      features: ["Manual", "Ar-condicionado", "Direção hidráulica"],
      photo: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop",
    },
    {
      id: "v3",
      model: "Volkswagen Gol 2020",
      year: 2020,
      category: "B",
      features: ["Manual", "Direção leve", "Econômico"],
      photo: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
    },
  ],
  reviews: [
    {
      id: "r1",
      studentName: "Ana Carolina Santos",
      studentPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "2024-12-05",
      comment: "Excelente instrutor! Muito paciente e didático. Passei de primeira graças às suas aulas. Super recomendo!",
      instructorReply: "Obrigado, Ana! Foi um prazer te ensinar. Parabéns pela aprovação! 🎉",
    },
    {
      id: "r2",
      studentName: "Pedro Henrique Lima",
      studentPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "2024-12-01",
      comment: "Melhor instrutor que já tive! Muito profissional, pontual e o carro é ótimo. As aulas foram muito produtivas.",
    },
    {
      id: "r3",
      studentName: "Juliana Alves",
      studentPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "2024-11-28",
      comment: "Estava super ansiosa para dirigir, mas o Carlos soube me acalmar e me passou muita confiança. Hoje dirijo tranquila!",
      instructorReply: "Fico muito feliz em ter contribuído para sua jornada, Juliana! Continue dirigindo com segurança!",
    },
    {
      id: "r4",
      studentName: "Rafael Costa",
      studentPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
      rating: 4,
      date: "2024-11-20",
      comment: "Ótimo instrutor, mas às vezes tinha dificuldade de encontrar horário disponível. No mais, super recomendo!",
    },
    {
      id: "r5",
      studentName: "Mariana Ferreira",
      studentPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "2024-11-15",
      comment: "Aulas maravilhosas! Aprendi muito sobre direção defensiva e segurança. O Carlos é muito atencioso e explica tudo detalhadamente.",
    },
    {
      id: "r6",
      studentName: "Lucas Oliveira",
      studentPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "2024-11-10",
      comment: "Excelente profissional! Me ajudou muito com baliza e manobras. Passei na primeira tentativa!",
    },
    {
      id: "r7",
      studentName: "Camila Rodrigues",
      studentPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "2024-11-05",
      comment: "Melhor decisão foi escolher o Carlos como instrutor. Super profissional, carros em ótimo estado e horários flexíveis.",
    },
    {
      id: "r8",
      studentName: "Bruno Martins",
      studentPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 4,
      date: "2024-10-28",
      comment: "Bom instrutor, carros bons. Apenas achei o preço um pouco salgado, mas vale a pena pela qualidade.",
    },
  ],
  location: {
    address: "Rua das Flores, 123 - Vila Mariana, São Paulo - SP",
    neighborhoods: [
      "Vila Mariana",
      "Moema",
      "Jardins",
      "Pinheiros",
      "Itaim Bibi",
      "Brooklin",
      "Santo Amaro",
      "Saúde",
    ],
    coordinates: { lat: -23.5880, lng: -46.6395 },
  },
  pricing: {
    basePrice: 120,
    serviceFee: 15,
  },
  stats: {
    responseTime: "~2h",
    acceptanceRate: "95%",
    memberSince: "Março 2024",
    documentVerified: true,
  },
  contact: {
    whatsapp: "+5511999999999",
    email: "carlos.silva@autoconnect.com",
  },
  availability: {
    "2024-12-15": ["09:00", "10:00", "14:00", "16:00"],
    "2024-12-16": ["08:00", "09:00", "15:00", "17:00"],
    "2024-12-17": ["10:00", "11:00", "14:00", "15:00"],
  },
};
