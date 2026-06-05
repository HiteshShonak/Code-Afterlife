import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

// Import type augmentations (side-effect import)
import '@/types/auth';

/** GitHub profile shape for the jwt callback. */
interface GitHubProfile {
  login?: string;
  id?: number;
  avatar_url?: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: { scope: 'read:user user:email public_repo' },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // First sign-in: populate token with user ID and GitHub data
      if (user) {
        token.id = user.id;
      }

      if (account && profile) {
        const ghProfile = profile as GitHubProfile;

        await prisma.user.update({
          where: { id: token.id as string },
          data: {
            username: ghProfile.login || null,
            githubId: ghProfile.id || null,
            image: ghProfile.avatar_url || null,
          },
        });

        token.username = ghProfile.login;
        token.githubId = ghProfile.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        // These fields are now properly typed via module augmentation
        session.user.id = token.id as string;
        session.user.username = token.username;
        session.user.githubId = token.githubId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Redirect to landing page for sign in
  },
});
