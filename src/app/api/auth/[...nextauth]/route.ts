import NextAuth, { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';
import { Account, Profile } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';

const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID!,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
  issuer: process.env.KEYCLOAK_ISSUER,
};

console.log('Keycloak Configuration:', {
  ...keycloakConfig,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});

interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  roles?: string[];
  sub?: string;
}

const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: keycloakConfig.clientId,
      clientSecret: keycloakConfig.clientSecret,
      issuer: keycloakConfig.issuer,
      authorization: {
        params: {
          scope: 'openid email profile',
          response_type: 'code',
          access_type: 'offline',
        }
      },
      httpOptions: {
        timeout: 40000
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
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
      // Rediriger vers le dashboard après la connexion
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
  logger: {
    error(code, metadata) {
      console.error('Auth error:', { code, metadata });
    },
    warn(code) {
      console.warn('Auth warning:', code);
    },
    debug(code, metadata) {
      console.log('Auth debug:', { code, metadata });
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
