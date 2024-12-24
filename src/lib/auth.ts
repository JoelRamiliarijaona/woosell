import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { getMongoDb } from './mongodb';

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

interface ExtendedJWT extends JWT {
  sub: string;
  roles?: string[];
  accessToken?: string;
  refreshToken?: string;
}

interface TokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles: string[];
  };
  [key: string]: unknown;
}

interface UserSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  };
  expires: string;
  accessToken?: string;
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
    maxAge: 24 * 60 * 60, // 24 heures
    updateAge: 5 * 60     // 5 minutes
  },
  callbacks: {
    async signIn({ profile }) {
      try {
        const keycloakProfile = profile as KeycloakProfile;
        if (!keycloakProfile?.sub) {
          console.error('No Keycloak ID (sub) found in profile');
          return false;
        }

        const db = await getMongoDb();

        // Rechercher l'utilisateur existant
        const existingUser = await db.collection('users').findOne({ keycloakId: keycloakProfile.sub });
        console.log('Existing user:', existingUser);

        if (!existingUser) {
          // Créer un nouvel utilisateur
          const newUser = {
            keycloakId: keycloakProfile.sub,
            email: keycloakProfile.email,
            name: keycloakProfile.name ?? keycloakProfile.preferred_username ?? keycloakProfile.email ?? keycloakProfile.sub,
            roles: keycloakProfile.realm_access?.roles || ['user'],
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await db.collection('users').insertOne(newUser);
          console.log('New user created:', result);
        } else {
          // Mettre à jour les rôles si nécessaire
          const currentRoles = existingUser.roles || ['user'];
          const newRoles = keycloakProfile.realm_access?.roles || ['user'];
          
          if (JSON.stringify(currentRoles.sort()) !== JSON.stringify(newRoles.sort())) {
            await db.collection('users').updateOne(
              { keycloakId: keycloakProfile.sub },
              { 
                $set: { 
                  roles: newRoles,
                  updatedAt: new Date()
                }
              }
            );
          }
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
          token.roles = profile.realm_access?.roles || ['user'];
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

        const sessionWithRoles = {
          ...session,
          user: {
            ...session.user,
            id: extendedToken.sub,
            roles: extendedToken.roles || ['user']
          },
          accessToken: extendedToken.accessToken
        };

        console.log('Final Session:', sessionWithRoles);
        return sessionWithRoles;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      // Si l'URL commence par le baseUrl (notre application)
      if (url.startsWith(baseUrl)) {
        // Si c'est un callback d'authentification, rediriger vers la page d'accueil
        if (url.includes('/api/auth/callback')) {
          return baseUrl;
        }
        // Sinon retourner l'URL demandée
        return url;
      }
      // Pour toute autre URL externe, rediriger vers la page d'accueil
      return baseUrl;
    }
  },
  debug: true,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  }
};

export async function verifyToken(request: Request): Promise<KeycloakProfile | null> {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) return null;

    const JWKS = createRemoteJWKSet(new URL(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`));
    
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.KEYCLOAK_ISSUER
    });

    // Cast to unknown first, then validate fields before casting to KeycloakProfile
    const profile = payload as unknown as TokenPayload;
    
    if (!profile.sub || typeof profile.sub !== 'string' ||
        !profile.email || typeof profile.email !== 'string' ||
        !profile.name || typeof profile.name !== 'string' ||
        !profile.preferred_username || typeof profile.preferred_username !== 'string' ||
        typeof profile.email_verified !== 'boolean') {
      console.error('Invalid token payload: missing required fields', profile);
      return null;
    }

    const keycloakProfile: KeycloakProfile = {
      sub: profile.sub,
      email: profile.email,
      email_verified: profile.email_verified,
      name: profile.name,
      preferred_username: profile.preferred_username,
      given_name: profile.given_name || '',
      family_name: profile.family_name || '',
      realm_access: profile.realm_access
    };

    return keycloakProfile;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export function isAdmin(session: UserSession | null): boolean {
  return session?.user?.roles?.includes('admin') || false;
}

export function hasRole(session: UserSession | null, role: string): boolean {
  return session?.user?.roles?.includes(role) || false;
}
