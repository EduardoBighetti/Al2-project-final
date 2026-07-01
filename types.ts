
export interface User {
  id: number;
  username: string;
  full_name?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: 'gerencia' | 'admin' | 'user' | 'gerente';
  is_blocked?: boolean;
  created_at?: string;
}

export interface AccessKey {
  id: number;
  key: string;
  role: 'gerencia' | 'admin' | 'user' | 'gerente';
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
  temp_limit?: number; // legacy limit
  has_alerts?: boolean;
  alert_limits?: Record<string, number>; // e.g. { "temperatura": 35, "tensao_eletrica": 220 }
  monitored_magnitudes?: string[]; // array of keys like ["temperatura", "umidade_relativa"]
  owner_uid?: string;
}

export interface Reading {
  id: number;
  sensor_id: number;
  sensor_identifier?: string;
  temperature?: number;
  humidity?: number;
  values?: Record<string, number>;
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

