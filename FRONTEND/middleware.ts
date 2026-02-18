
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login", "/forgot-password", "/auth/change-password", "/"]

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value
    const { pathname } = request.nextUrl

    
    const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith("/public"))

    
    
    
    
    if (isPublicPath && token) {
        if (pathname === "/login") {
            
            
            
            
            return NextResponse.next()
        }
        return NextResponse.next()
    }

    
    if (!isPublicPath && !token) {
        const loginUrl = new URL("/login", request.url)
        
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
    ],
}
