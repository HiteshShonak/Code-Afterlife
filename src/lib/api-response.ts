import { NextResponse } from 'next/server';

export const apiResponse = {
  /**
   * Return a successful JSON response (200).
   */
  success<T>(data: T, message?: string) {
    return NextResponse.json(
      { success: true as const, data, ...(message && { message }) },
      { status: 200 }
    );
  },

  /**
   * Return a created JSON response (201).
   */
  created<T>(data: T, message?: string) {
    return NextResponse.json(
      { success: true as const, data, ...(message && { message }) },
      { status: 201 }
    );
  },

  /**
   * Return an error JSON response with the given status code.
   */
  error(message: string, statusCode = 400, errors?: Record<string, string[]>) {
    return NextResponse.json(
      { success: false as const, message, ...(errors && { errors }) },
      { status: statusCode }
    );
  },

  /**
   * Return a no-content response (204).
   */
  noContent() {
    return new Response(null, { status: 204 });
  },
};
