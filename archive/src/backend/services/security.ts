import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import ipinfo from 'ipinfo-express';

// Path to log file
const logFilePath = path.join('/tmp', 'ip_log.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Middleware for logging requests with IP info
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
