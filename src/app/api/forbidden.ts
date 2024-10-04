// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Middleware function
export function middleware(req: NextRequest) {
    const internalRequestHeader = req.headers.get('x-internal-request');

    if (!internalRequestHeader || internalRequestHeader !== 'true') {
        return NextResponse.json(
            { message: 'Access forbidden: Internal requests only.' },
            { status: 403 }
        );
    }

    // If the check passes, allow the request to proceed
    return NextResponse.next();
}

// Middleware config (optional, you can specify paths)
export const config = {
    matcher: ['/api/mint/*'], // Apply middleware only to API routes (adjust paths as necessary)
};
