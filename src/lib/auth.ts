import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { NextAuthOptions, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { AdapterUser } from 'next-auth/adapters';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { connectToDatabase } from './mongodb';

interface KeycloakProfile {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  realm_access?: {
    roles: string[];
  };
}

interface ExtendedUser extends User {
  id: string;
  roles?: string[];
}

interface ExtendedJWT extends JWT {
  id: string;
  roles?: string[];
  accessToken?: string;
  refreshToken?: string;
  sub?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: { 
        params: { 
          scope: 'openid email profile offline_access',
          response_type: 'code',
          access_type: 'offline',
        } 
      },
      httpOptions: {
        timeout: 40000
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!profile?.sub) {
          console.error('No Keycloak ID (sub) found in profile');
          return false;
        }

        const { db } = await connectToDatabase();
        if (!db) {
          console.error('Database connection failed');
          return false;
        }

        // Rechercher l'utilisateur existant
        const existingUser = await db.collection('users').findOne({ keycloakId: profile.sub });
        console.log('Existing user:', existingUser);

        if (!existingUser) {
          // Créer un nouvel utilisateur
          const newUser = {
            keycloakId: profile.sub,
            email: profile.email,
            name: profile.name || profile.preferred_username,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await db.collection('users').insertOne(newUser);
          console.log('New user created:', result);
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      try {
        if (profile) {
          console.log('JWT Profile:', profile);
          token.sub = profile.sub;
        }
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
        }
        console.log('JWT Token:', token);
        return token;
      } catch (error) {
        console.error('Error in jwt callback:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        const extendedToken = token as ExtendedJWT;
        console.log('Session Token:', extendedToken);
        
        if (!extendedToken.sub) {
          console.error('No sub in token');
          throw new Error('No sub in token');
        }

        const sessionWithId = {
          ...session,
          user: {
            ...session.user,
            id: extendedToken.sub
          },
          accessToken: extendedToken.accessToken
        };

        console.log('Final Session:', sessionWithId);
        return sessionWithId;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        if (url.includes('/api/')) {
          return `${baseUrl}/dashboard`;
        }
        return url;
      }
      return baseUrl;
    }
  },
  debug: true,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  handlers: [
    {
      page: '/api/auth/verify-token',
      handler: verifyToken,
    },
  ],
};

export async function verifyToken(request: Request): Promise<KeycloakProfile | null> {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) return null;

    const JWKS = createRemoteJWKSet(new URL(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`));
    
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.KEYCLOAK_ISSUER
    });

    return payload as KeycloakProfile;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
