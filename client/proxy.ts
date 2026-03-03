// client/middleware.ts
// Next.js Edge Middleware — protects /dashboard routes and prevents
// authenticated users from accessing the login page.

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh the session token if expired (keeps user logged in)
  const { data: { user } } = await supabase.auth.getUser();

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginPage = request.nextUrl.pathname === '/';

  // Redirect unauthenticated users trying to access dashboard
  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // We no longer forcefully redirect authenticated users away from the login page.
  // If they want to visit '/', let them see the login form. They can still click 'Go to Dashboard'
  // or use the normal navigation. 

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static files, images, and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
