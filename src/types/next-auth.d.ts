import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
    roles: string[];
    accessToken: string;
  }

  interface Profile {
    realm_access?: {
      roles: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles: string[];
    accessToken: string;
    refreshToken: string;
    idToken: string;
  }
}
