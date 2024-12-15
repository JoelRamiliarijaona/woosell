import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Liste des routes publiques
  const publicRoutes = ['/', '/api/auth', '/auth/signin', '/auth/error'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/')
  );

  // Si c'est une route publique, on autorise
  if (isPublicRoute) {
    const response = NextResponse.next();
    // Assurer que les cookies sont correctement configurés pour l'authentification
    if (pathname.startsWith('/api/auth')) {
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      response.headers.set('Set-Cookie', `next-auth.state=; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
    }
    return response;
  }

  try {
    // Vérifier le token
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET
    });

    // Si pas de token et route protégée, rediriger vers l'API de connexion
    if (!token) {
      const signInUrl = new URL('/api/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Autoriser la requête avec le token
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest).*)',
  ],
};
