import KeycloakProvider from 'next-auth/providers/keycloak';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID || '',
      clientSecret: process.env.KEYCLOAK_SECRET || '',
      issuer: process.env.KEYCLOAK_ISSUER,
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
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
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
  }
  
  return response;
}

export { handler as POST, handler as HEAD };
