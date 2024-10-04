import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Path to log file
const logFilePath = path.join('/tmp', 'ip_log.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

/**
 * Middleware for logging incoming requests with IP information.
 *
 * This middleware logs the IP address and location (city, region, country)
 * of the incoming request to a specified log file. The log entry includes
 * a timestamp, the IP address, and the location.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The outgoing response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 *
 * @returns {void} This function does not return a value; it calls `next()`
 * to pass control to the next middleware.
 */
const logger = (req: Request, res: Response, next: NextFunction) => {
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress || 'IP not found';

    const logEntry = `${new Date().toISOString()} - IP: ${ip}`;

    const city = req.ipinfo?.city || 'Unknown City';
    const region = req.ipinfo?.region || 'Unknown Region';
    const country = req.ipinfo?.country || 'Unknown Country';
    const location = `${city}, ${region}, ${country}`;

    const fullLogEntry = `${logEntry} - Location: ${location}\n`;

    logStream.write(fullLogEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        } else {
            console.log(fullLogEntry);
        }
    });

    next();
};

export default logger;
