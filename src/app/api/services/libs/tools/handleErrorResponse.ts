import { NextRequest, NextResponse } from "next/server";

class AppError extends Error {
    constructor(public message: string, public statusCode: number = 500) {
        super(message);
        this.name = "AppError";
    }
}

export async function handleErrorResponse(err: unknown, customMessage?: string) {
    if (err instanceof Error) {
        console.error('❌ Error:', err.message, { stack: err.stack });
    } else {
        console.error('❌ Unexpected error:', err);
    }

    let defaultMessage = customMessage || 'An error occurred while processing the request.';
    let statusCode = 500;

    if (err instanceof AppError) {
        defaultMessage = err.message;
        statusCode = err.statusCode;
    } else if (isValidationError(err)) {
        defaultMessage = 'Validation errors occurred.';
        statusCode = 400; // Bad request for validation errors
    }
    return NextResponse.json(
        {
            error: {
                message: defaultMessage,
                ...(statusCode !== 500 && { details: getErrorDetails(err) }),
            },
        },
        { status: statusCode }
    );
}

function isValidationError(err: unknown): err is { validationErrors: any } {
    return typeof err === 'object' && err !== null && 'validationErrors' in err;
}

function getErrorDetails(err: unknown): any {
    if (typeof err === 'object' && err !== null) {
        return (err as any).details || null;
    }
    return null;
}
