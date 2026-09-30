# Project Bulletin Board

A plain HTML/CSS/JavaScript frontend connected to MySQL through a small Python FastAPI server:

Browser → `GET /api/events` → MySQL `CollegeEventDB.Event`

## Run locally

Requires Python 3.10+ and a running MySQL server.

1. Create the database and load the sample data **once on a fresh database**:
   ```sh
   mysql -u root -p < backend/tables.sql
   mysql -u root -p CollegeEventDB < backend/queries.sql
   ```
   If you already imported these files, skip this step. You can also execute them in MySQL Workbench (select `CollegeEventDB` before running `queries.sql`).

2. Install the dependency and create your local configuration:
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
   Keep your existing `.env`. On a fresh checkout, copy `.env.example` to `.env` and enter your MySQL username and password. Quote passwords containing `#`, for example `DB_PASSWORD="your-password"`. Keep this file private; it is ignored by Git.

3. Start the app:
   ```sh
   python backend/server.py
   ```
   Open **http://localhost:3000**. Use this address instead of opening the HTML directly or using Live Server.

The upcoming event cards come from the database, ordered by start date. Events whose end date (or start date when no end date is set) has passed are excluded. Undated events are included. Refresh the page after changing records in MySQL. The old hardcoded featured event has been removed to avoid displaying stale data.

This minimal integration reads events; registration, category filtering, and saved events are not implemented. No schema changes are required. Database credentials stay on the server, and the server binds to localhost for local development.

If events fail to load, check that MySQL is running, the SQL files have been imported, and `.env` matches your database settings. The terminal logs the database error code.

FastAPI serves the frontend and `/api/events` on the same port. API documentation is available at **http://localhost:3000/docs**. No Node.js or npm installation is needed. Activate `.venv` in each new terminal before starting the server.
