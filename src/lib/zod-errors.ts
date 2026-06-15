// zod issue
interface ZodIssue {
  readonly path: ReadonlyArray<string | number>;
  readonly message: string;
}

// check zod error
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

// get field errors
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
