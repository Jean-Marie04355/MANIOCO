export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
