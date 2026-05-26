import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /** Extended User with Code Afterlife fields. */
  interface User {
    id: string;
    username?: string | null;
    githubId?: number | null;
  }

  /** Session.user includes our custom fields. */
  interface Session {
    user: User & {
      id: string;
      username?: string | null;
      githubId?: number | null;
    };
  }
}

declare module 'next-auth/jwt' {
  /** JWT token includes our custom fields for session callback. */
  interface JWT {
    id?: string;
    username?: string | null;
    githubId?: number | null;
  }
}

/** Authenticated user as returned by requireAuth(). */
export interface AuthUser {
  /** Unique user ID (cuid from database). */
  readonly id: string;
  /** Display name from GitHub. */
  readonly name: string | null;
  /** Email from GitHub (may be private). */
  readonly email: string | null;
  /** GitHub avatar URL. */
  readonly image: string | null;
  /** GitHub username (login). */
  readonly username: string | null;
  /** GitHub user ID (numeric). */
  readonly githubId: number | null;
}
