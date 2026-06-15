import { NextResponse } from 'next/server';

export const apiResponse = {
  // return 200 ok
  success<T>(data: T, message?: string) {
    return NextResponse.json(
      { success: true as const, data, ...(message && { message }) },
      { status: 200 }
    );
  },

  // return 201 created
  created<T>(data: T, message?: string) {
    return NextResponse.json(
      { success: true as const, data, ...(message && { message }) },
      { status: 201 }
    );
  },

  // return error response
  error(message: string, statusCode = 400, errors?: Record<string, string[]>) {
    return NextResponse.json(
      { success: false as const, message, ...(errors && { errors }) },
      { status: statusCode }
    );
  },

  // return 204 no content
  noContent() {
    return new Response(null, { status: 204 });
  },
};
