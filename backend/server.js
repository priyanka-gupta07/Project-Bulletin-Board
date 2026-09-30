import http from 'node:http';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'CollegeEventDB',
    dateStrings: true,
    connectionLimit: 5,
    connectTimeout: 5000,
});

// Serve only public frontend files, never credentials or SQL files.
const files = {
    '/': ['../frontend/index.html', 'text/html'],
    '/index.html': ['../frontend/index.html', 'text/html'],
    '/style.css': ['../frontend/style.css', 'text/css'],
    '/app.js': ['../frontend/app.js', 'text/javascript'],
};

const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (req.method !== 'GET') {
        res.writeHead(405, { Allow: 'GET' });
        return res.end('Method not allowed');
    }
    if (pathname === '/api/events') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        try {
            const [events] = await pool.query(`
                SELECT Event_ID, Event_Name, Start_Date, End_Date, Eligibility,
                       Registration_FEE, Venue_Name, Location, Max_participants
                FROM Event
                WHERE COALESCE(End_Date, Start_Date) >= CURDATE()
                   OR (Start_Date IS NULL AND End_Date IS NULL)
                ORDER BY Start_Date IS NULL, Start_Date, Event_ID
            `);
            res.end(JSON.stringify(events));
        } catch (error) {
            console.error('Could not load events:', error.code || 'Database error');
            res.writeHead(503);
            res.end(JSON.stringify({ error: 'Events are unavailable. Please try again later.' }));
        }
        return;
    }
    const file = files[pathname];
    if (!file) {
        res.writeHead(404);
        return res.end('Not found');
    }
    try {
        const body = await readFile(new URL(file[0], import.meta.url));
        res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` });
        res.end(body);
    } catch {
        res.writeHead(500);
        res.end('Unable to load page');
    }
});

server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
    console.log(`Bulletin board: http://localhost:${server.address().port}`);
});
