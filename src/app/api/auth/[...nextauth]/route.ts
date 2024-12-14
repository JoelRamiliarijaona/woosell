'use server';

import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';
import { Account, Profile } from 'next-auth';

type ExtendedJWT = JWT & {
  roles: string[];
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

interface ExtendedAccount extends Account {
  access_token: string;
  refresh_token: string;
  id_token: string;
}

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' ? 'dev-client' : process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' ? 'dev-secret' : process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' ? 'http://localhost:3000' : process.env.KEYCLOAK_ISSUER,
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }): Promise<JWT> {
      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
        return {
          ...token,
          accessToken: 'dev-token',
          refreshToken: 'dev-refresh-token',
          idToken: 'dev-id-token',
          roles: ['user'],
        } as ExtendedJWT;
      }

      if (account) {
        const extendedAccount = account as ExtendedAccount;
        return {
          ...token,
          accessToken: extendedAccount.access_token,
          refreshToken: extendedAccount.refresh_token || 'default-refresh-token',
          idToken: extendedAccount.id_token || 'default-id-token',
          roles: (profile as any)?.realm_access?.roles || ['user'],
        } as ExtendedJWT;
      }

      // S'assurer que toutes les propriétés requises sont présentes
      return {
        ...token,
        accessToken: token.accessToken || 'default-access-token',
        refreshToken: token.refreshToken || 'default-refresh-token',
        idToken: token.idToken || 'default-id-token',
        roles: token.roles || ['user'],
      } as ExtendedJWT;
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      return {
        ...session,
        user: {
          ...session.user,
          accessToken: extendedToken.accessToken,
          roles: extendedToken.roles,
        },
      };
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
});

export const GET = handler;
export const POST = handler;
