import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

interface Session {
  roles?: string[];
}

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
    }
    return response;
  }

  try {
    // Vérifier le token
    const session = await getToken({ req: request }) as Session | null;

    // Si pas de token et route protégée, rediriger vers la page d'accueil
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Protection des routes admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!session.roles?.includes('admin')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Protection des routes utilisateur
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }

    // Autoriser la requête avec le token et ajouter du cache
    const response = NextResponse.next();
    
    // Ajouter du cache pour les requêtes API
    if (pathname.startsWith('/api/')) {
      // Cache de 5 minutes pour les requêtes API
      response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    } else {
      // Pas de cache pour les autres routes
      response.headers.set('Cache-Control', 'no-store, max-age=0');
    }
    
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
