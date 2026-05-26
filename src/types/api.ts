/** Successful API response wrapper. */
export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

/** Error API response wrapper. */
export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

/** Discriminated union of success/error API responses. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Paginated success response with metadata. */
export type PaginatedResponse<T> = ApiSuccessResponse<{
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}>;
