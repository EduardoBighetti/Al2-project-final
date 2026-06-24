
export interface User {
  id: number;
  username: string;
  full_name?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: 'gerencia' | 'admin' | 'user';
  created_at?: string;
}

export interface AccessKey {
  id: number;
  key: string;
  role: 'gerencia' | 'admin' | 'user';
  is_used: boolean;
  created_at: string;
}

export interface Sensor {
  id: number;
  identifier: string;
  name: string;
  status: 'active' | 'offline' | 'maintenance';
  last_seen?: string;
  token?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  floor_x?: number; // Posição X em % na planta baixa
  floor_y?: number; // Posição Y em % na planta baixa
  temp_limit?: number;
  owner_uid?: string;
}

export interface Reading {
  id: number;
  sensor_id: number;
  temperature: number;
  humidity: number;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface ApiError {
  message: string;
}
