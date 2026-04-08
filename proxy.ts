import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/home', '/login', '/auth/login', '/auth', '/health'];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get tokens from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const userId = request.cookies.get('userId')?.value;

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // If user is accessing protected route without tokens, redirect to login
    if (!isPublicRoute && (!accessToken || !refreshToken)) {
        // Try to refresh tokens if both refreshToken and userId are available
        if (refreshToken && userId) {
            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId,
                        refreshToken,
                        userType: "main"
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const newAccessToken = data?.data?.accessToken;
                    const newRefreshToken = data?.data?.refreshToken || refreshToken;

                    if (newAccessToken) {
                        // Create response with next page
                        const nextResponse = NextResponse.next();

                        // Set the new tokens in cookies
                        nextResponse.cookies.set('accessToken', newAccessToken, {
                            path: '/',
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 60 * 60 * 24 * 7, // 7 days
                        });

                        nextResponse.cookies.set('refreshToken', newRefreshToken, {
                            path: '/',
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 60 * 60 * 24 * 7, // 7 days
                        });

                        nextResponse.cookies.set('userId', userId, {
                            path: '/',
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 60 * 60 * 24 * 7, // 7 days
                        });

                        return nextResponse;
                    }
                }
            } catch (error) {
                console.error('Token refresh failed in middleware:', error);
            }
        }

        // If refresh failed or tokens not available, redirect to home
        return NextResponse.redirect(new URL('/home', request.url));
    }

    // If user is on public/auth pages and has valid tokens, redirect to root
    if ((pathname === '/home' || pathname === '/login' || pathname === '/auth/login') && accessToken && refreshToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.png$).*)',
    ],
};
