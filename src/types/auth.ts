import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  // custom user fields
  interface User {
    id: string;
    username?: string | null;
    githubId?: number | null;
  }

  // custom session fields
  interface Session {
    user: User & {
      id: string;
      username?: string | null;
      githubId?: number | null;
    };
  }
}

declare module 'next-auth/jwt' {
  // custom jwt fields
  interface JWT {
    id?: string;
    username?: string | null;
    githubId?: number | null;
  }
}

// auth user shape
export interface AuthUser {
  // user id
  readonly id: string;
  // user name
  readonly name: string | null;
  // user email
  readonly email: string | null;
  // avatar url
  readonly image: string | null;
  // gh username
  readonly username: string | null;
  // gh id
  readonly githubId: number | null;
}
