import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      roles?: string[];
      accessToken?: string;
    };
    roles?: string[];
    accessToken?: string;
    expires: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    roles?: string[];
    accessToken?: string;
  }

  interface Profile {
    realm_access?: {
      roles: string[];
    };
    email_verified?: boolean;
    sub?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles?: string[];
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    exp?: number;
    iat?: number;
    jti?: string;
  }
}
