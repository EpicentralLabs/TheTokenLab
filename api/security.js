"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Path to log file
const logFilePath = path_1.default.join('/tmp', 'ip_log.txt');
const logStream = fs_1.default.createWriteStream(logFilePath, { flags: 'a' });
// Middleware for logging requests with IP info
const logger = (req, res, next) => {
    const forwardedFor = req.headers['x-forwarded-for'];
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
        }
        else {
            console.log(fullLogEntry);
        }
    });
    next();
};
exports.default = logger;
