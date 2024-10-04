import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to enforce security rules for the /api/mint endpoint.
 *
 * This middleware checks if the request comes from an allowed origin
 * and logs GET requests from client IPs. Unauthorized requests will
 * be redirected to a forbidden endpoint.
 *
 * @param {NextRequest} req - The incoming request object.
 *
 * @returns {NextResponse} - The response object indicating the next action
 * (either continuing to the next middleware or rewriting to the forbidden endpoint).
 */
export const config = {
    matcher: ['/api/mint'],
};

export function middleware(req: NextRequest) {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    const requestOrigin = req.headers.get('origin');
    const clientIP = req.headers.get('x-forwarded-for') || req.ip;
    const isInternalRequest =
        clientIP === req.ip ||
        requestOrigin === req.nextUrl.origin;

    // Log the client IP for GET requests
    if (req.method === 'GET') {
        console.log(`GET request from IP: ${clientIP}`);
    }

    // Check if the request is internal; if not, rewrite to forbidden
    if (!isInternalRequest) {
        console.warn(`Unauthorized request from IP: ${clientIP}`);
        return NextResponse.rewrite(new URL('/api/forbidden', req.url));
    }

    // Check if the request's origin is allowed
    if (requestOrigin && requestOrigin !== allowedOrigin) {
        console.warn(`Request from disallowed origin: ${requestOrigin}`);
        return NextResponse.rewrite(new URL('/api/forbidden', req.url));
    }

    return NextResponse.next();
}
