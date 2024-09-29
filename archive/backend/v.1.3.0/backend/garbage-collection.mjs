// backend/garbage-collection.mjs

import fs from 'fs';
import path from 'path';

// Adjust the uploads directory path if necessary
const uploadsDirectory = path.join(process.cwd(), 'backend', 'uploads');
const cleanupInterval = 15 * 60 * 1000;
const fileAgeLimit = 10 * 60 * 1000;

export function cleanupOldFiles() {
    fs.readdir(uploadsDirectory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(uploadsDirectory, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }

                // Check if the file is older than 10 minutes
                if (now - stats.mtimeMs > fileAgeLimit) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting file:', err);
                        } else {
                            console.log(`Deleted old file: ${file}`);
                        }
                    });
                }
            });
        });
    });
}

// Set interval to run cleanup every 15 minutes
setInterval(cleanupOldFiles, cleanupInterval);

// Initial cleanup when the script starts
cleanupOldFiles();
