// express-ipinfo.d.ts
import { Request } from 'express';

declare module 'express' {
    export interface Request {
        ipinfo?: {
            city?: string;
            region?: string;
            country?: string;
            [key: string]: any;
        };
    }
}
