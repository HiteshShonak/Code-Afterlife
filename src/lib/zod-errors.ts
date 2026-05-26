/**
 * Zod issue shape — minimal interface to avoid importing Zod at runtime.
 * Matches both Zod v3 and v4 issue shapes.
 */
interface ZodIssue {
  readonly path: ReadonlyArray<string | number>;
  readonly message: string;
}

/**
 * Check if an unknown error is a ZodError by duck-typing.
 * Avoids importing Zod to keep the error layer dependency-free.
 */
export function isZodError(
  error: unknown
): error is Error & { issues: ZodIssue[] } {
  return (
    error instanceof Error &&
    error.name === 'ZodError' &&
    'issues' in error &&
    Array.isArray((error as Record<string, unknown>).issues)
  );
}

/**
 * Extract structured field errors from a ZodError.
 * Returns a map of field path → error messages.
 *
 * @example
 * { "title": ["Too short"], "stack": ["Required"] }
 */
export function extractZodErrors(
  issues: ReadonlyArray<ZodIssue>
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}
