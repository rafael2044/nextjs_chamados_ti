import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  sub: string;
  privilegio: string;
  exp: number;
}

const adminRoutes = ['/usuarios', '/unidades', '/modulos', '/relatorio'];
const protectedRoutes = ['/chamados'];

const isAccessing = (routes: string[], pathname: string) => {
  return routes.some(route => pathname.startsWith(route));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('jwt_token')?.value;

  const isAccessingAdminRoute = isAccessing(adminRoutes, pathname);
  const isAccessingProtectedRoute = isAccessing(protectedRoutes, pathname);
  const isAccessingAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/registrar');

  const loginUrl = new URL('/login', request.url);
  const homeUrl = new URL('/', request.url); 

  if (isAccessingAdminRoute) {
    if (!token) {
      return NextResponse.redirect(loginUrl);
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);

      if (decoded.privilegio !== 'Administrador') { 
        return NextResponse.redirect(homeUrl);
      }
      
      return NextResponse.next();

    } catch (error) {
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('jwt_token');
      response.cookies.delete('refresh_token');
      return response;
    }
  }

  // (O resto da lógica)
  if (isAccessingProtectedRoute) {
    if (!token) return NextResponse.redirect(loginUrl);
    return NextResponse.next();
  }
  if (isAccessingAuthRoute) {
    if (token) return NextResponse.redirect(homeUrl);
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}