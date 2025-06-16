export interface HostnameData {
  hostname: string;
  ip: string;
  userId: string;
  lastUpdated: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  hostname?: string;
  ip?: string;
  updated?: string;
}

export interface UpdateRequest {
  hostname: string;
  apiKey: string;
  ip?: string;
}

export interface CreateHostnameRequest {
  hostname: string;
  ip: string;
}

export interface DeleteHostnameRequest {
  hostname: string;
}

export interface ApiKeyResponse {
  apiKey: string;
}

export interface HostnamesResponse {
  hostnames: HostnameData[];
}

export interface ResolveResponse {
  hostname: string;
  ip: string;
  lastUpdated: string;
}