import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { JWT } from "next-auth/jwt";
import { connectToDatabase } from '@/lib/mongodb';

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

interface SignInParams {
  user: {
    id: string;
    name: string;
    email: string;
  };
  account: {
    access_token: string;
    expires_at: number;
    refresh_token: string;
    id_token: string;
  };
  profile: KeycloakProfile;
}

interface JWTParams {
  token: JWT;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  account?: {
    access_token: string;
    expires_at: number;
    refresh_token: string;
    id_token: string;
  };
  profile?: KeycloakProfile;
  trigger?: "signIn" | "signUp" | "update";
}

interface SessionParams {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    expires: string;
  };
  token: JWT & {
    roles?: string[];
    accessToken?: string;
  };
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
    async signIn({ user, account, profile }: SignInParams) {
      try {
        console.log('SignIn Profile:', profile);
        
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

    async jwt({ token, user, account, profile }: JWTParams) {
      try {
        if (profile) {
          console.log('JWT Profile:', profile);
          token.sub = profile.sub;
          token.roles = profile.realm_access?.roles || [];
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

    async session({ session, token }: SessionParams) {
      try {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub
          },
          roles: token.roles || [],
          accessToken: token.accessToken
        };
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
