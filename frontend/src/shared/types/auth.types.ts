export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  apellido: string;
  role: string;
  estado?: string;
  telefono?: string;
  empresa?: string;
  cedula?: string;
  ultimoAcceso?: string;
  creationDate?: string;
  updateDate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name: string;
  apellido: string;
  role?: string;
  telefono?: string;
  empresa?: string;
  cedula?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface Session {
  id: string;
  userAgent: string;
  ip: string;
  expiresAt: string;
  creationDate: string;
  jti: string;
}
