export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "BUYER" | "SELLER" | "ADMIN";
}

export interface ServiceError {
  error: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
