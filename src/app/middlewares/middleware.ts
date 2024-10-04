import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    matcher: ['/api/mint'],
};

export function middleware(req: NextRequest) {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
    const requestOrigin = req.headers.get('origin');
    const clientIP = req.headers.get('x-forwarded-for') || req.ip;
    const isInternalRequest =
        clientIP === req.ip ||
        requestOrigin === req.nextUrl.origin;

    if (req.method === 'GET') {
        console.log(`GET request from IP: ${clientIP}`);
    }

    if (!isInternalRequest) {
        console.warn(`Unauthorized request from IP: ${clientIP}`);
        return NextResponse.rewrite(new URL('/api/forbidden', req.url));
    }

    if (requestOrigin && requestOrigin !== allowedOrigin) {
        console.warn(`Request from disallowed origin: ${requestOrigin}`);
        return NextResponse.rewrite(new URL('/api/forbidden', req.url));
    }

    return NextResponse.next();
}
