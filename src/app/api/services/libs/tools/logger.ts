import winston from "winston";


/**
 * A custom logger instance using Winston for logging messages.
 *
 * This logger is configured to log messages to the console with
 * a timestamp, log level, and message content. The log level is
 * set to 'debug', allowing for verbose logging during development.
 *
 * @type {winston.Logger} The Winston logger instance.
 */
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        // @ts-ignore
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

export default logger;
