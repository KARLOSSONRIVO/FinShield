
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login", "/forgot-password", "/auth/change-password", "/"]

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value
    const { pathname } = request.nextUrl

    // Check if the path is public
    const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith("/public"))

    // If path is public and user is authenticated, redirect to their dashboard (or home)
    // Note: We don't easily know the role here without decoding the token. 
    // A simple redirect to a generic dashboard or just letting them access public pages is fine.
    // Usually, we block /login if already logged in.
    if (isPublicPath && token) {
        if (pathname === "/login") {
            // We can't easily know the role to redirect to the *correct* dashboard without decoding.
            // We could decode the JWT here if we install 'jose' or 'jwt-decode' but for now,
            // let's just let them stay or redirect to a default.
            // Or, we can rely on the client-side redirect in /login page which acts faster usually.
            return NextResponse.next()
        }
        return NextResponse.next()
    }

    // If path is protected and no token, redirect to login
    if (!isPublicPath && !token) {
        const loginUrl = new URL("/login", request.url)
        // loginUrl.searchParams.set("from", pathname) // Optional: save return url
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
    ],
}
