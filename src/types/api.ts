// success response
export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

// error response
export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

// api response union
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// paginated response
export type PaginatedResponse<T> = ApiSuccessResponse<{
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}>;
