import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
);

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
    if (!req._startAt || !res._startAt) {
        return '0';
    }
    const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
               (res._startAt[1] - req._startAt[1]) * 1e-6;
    return ms.toFixed(3);
});

// Development logger (console)
const devLogger = morgan('dev');

// Production logger (file)
const prodLogger = morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms',
    { stream: accessLogStream }
);

// Error logger
const errorLogger = (err, req, res, next) => {
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.url} - ${err.message}\n${err.stack}\n\n`;
    errorLogStream.write(logMessage);
    next(err);
};

// Choose logger based on environment
export const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;
export { errorLogger };
