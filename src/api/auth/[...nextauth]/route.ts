import KeycloakProvider from 'next-auth/providers/keycloak';
import NextAuth, { Account, NextAuthOptions, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';

const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID || '',
      clientSecret: process.env.KEYCLOAK_SECRET || '',
      issuer: process.env.KEYCLOAK_ISSUER,
    })
  ],
  session: {
    maxAge: 60 * 60, // 1 heure en secondes
    updateAge: 60 * 60, // Met à jour la session seulement après 1 heure
  },
  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};

const handler = NextAuth(authOptions);

// Ajouter des headers de cache pour l'endpoint de session
export async function GET(request: Request) {
  const response = await handler(request);
  
  // Si c'est une requête de session, ajouter des headers de cache
  if (request.url.includes('/api/auth/session')) {
    (response as Response).headers.set('Cache-Control', 'private, max-age=3600, stale-while-revalidate=60'); // Cache pour 1 heure
  }
  
  return response;
}

export { handler as POST, handler as HEAD };
