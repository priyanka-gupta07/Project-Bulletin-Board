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

   On an existing database, make sure the user-event table exists:
   ```sh
   mysql -u root -p CollegeEventDB < backend/user_events.sql
   ```

   Then update existing tables for registration links. This migration is safe to rerun:
   ```sh
   mysql -u root -p CollegeEventDB < backend/registration_links.sql
   ```

   To add the newer sample events without reloading other sample records, run:
   ```sh
   mysql -u root -p CollegeEventDB < backend/more_events.sql
   ```
   This script can be run repeatedly; it updates sample event IDs 104–113 in place.

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

The page supports event details, search, category filters, saved events, external registration links, and adding, editing, and deleting your own events. Categories use keyword matching on event names because the schema has no category field; an event can match multiple categories. Saved events use browser local storage and do not register participants in the database. Sample registration links point to `example.com` and should be replaced with real links. Database credentials stay on the server, and the server binds to localhost for local development.

If events fail to load, check that MySQL is running, the SQL files have been imported, and `.env` matches your database settings. The terminal logs the database error code.

FastAPI serves the frontend and `/api/events` on the same port. API documentation is available at **http://localhost:3000/docs**. No Node.js or npm installation is needed. Activate `.venv` in each new terminal before starting the server.


## Free hosting: Render + Aiven

1. In https://console.aiven.io/, create a **MySQL** service on the **Free** plan. From its overview, copy the host, port, username and password, and download the CA certificate (`ca.pem`).
2. In MySQL Workbench, create a connection using those details. In the SSL settings, choose **Require and Verify Identity** and select `ca.pem` as the SSL CA file. On this new, empty hosted server, run `backend/tables.sql`, then select `CollegeEventDB` and run `backend/queries.sql` to load the project's sample data. Do not run the seed script again on an existing populated database. To retain changed local data instead, export/import your local database using Workbench.
3. Commit and push the application changes to your GitHub repository, keeping `.env` private.
4. At https://dashboard.render.com/, choose **New → Web Service**, connect this repository, and select:

   | Setting | Value |
   | --- | --- |
   | Language | Python 3 |
   | Root directory | Leave blank |
   | Build command | `pip install -r requirements.txt` |
   | Start command | `uvicorn backend.server:app --host 0.0.0.0 --port $PORT` |
   | Instance type | Free |

5. Add the Render environment variables `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` from Aiven. Set `DB_NAME=CollegeEventDB`. Enter the password directly in Render, without the surrounding quotes used in `.env` files.
6. Under Render's **Secret Files**, add `ca.pem` containing the downloaded CA certificate. Set `DB_SSL_CA=/etc/secrets/ca.pem`. The app uses this certificate to verify the database server and encrypt the connection.
7. Deploy and open the generated `https://...onrender.com` URL. `/api/events` should return your upcoming events. Render supplies `PORT`; do not copy your local `PORT=3000` setting.

For an existing hosted database, apply `backend/registration_links.sql` after creating the `User_Event` table. Both the frontend and API run in the same Render service. Render Free sleeps after 15 minutes without traffic, so the first visit after that can take about a minute. Aiven may power down inactive free databases; these can be started again in its console. Saved events remain specific to the browser and website address, so localhost bookmarks do not transfer automatically.
