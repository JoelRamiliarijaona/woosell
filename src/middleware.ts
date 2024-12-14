import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Récupérer l'en-tête Origin
  const origin = request.headers.get('origin') || '';

  // Vérifier si la requête est une requête API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Retourner la réponse avec les en-têtes CORS appropriés
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
