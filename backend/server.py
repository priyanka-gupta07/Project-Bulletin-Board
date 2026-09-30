"""Serve the bulletin board and its MySQL events API."""

import logging
import os
from pathlib import Path

import pymysql
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", interpolate=False)
app = FastAPI(title="Bulletin Board API")
logger = logging.getLogger(__name__)


@app.get("/api/events")
def events():
    headers = {"Cache-Control": "no-store"}
    try:
        with pymysql.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "CollegeEventDB"),
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=5,
            read_timeout=5,
            autocommit=True,
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT Event_ID, Event_Name, Start_Date, End_Date, Eligibility,
                           Registration_FEE, Venue_Name, Location, Max_participants
                    FROM Event
                    WHERE COALESCE(End_Date, Start_Date) >= CURDATE()
                       OR (Start_Date IS NULL AND End_Date IS NULL)
                    ORDER BY Start_Date IS NULL, Start_Date, Event_ID
                """)
                rows = cursor.fetchall()
        # Preserve the original API's decimal strings and ISO date format.
        for row in rows:
            if row["Registration_FEE"] is not None:
                row["Registration_FEE"] = str(row["Registration_FEE"])
        return JSONResponse(jsonable_encoder(rows), headers=headers)
    except pymysql.MySQLError as error:
        logger.error("Could not load events; database error code: %s", error.args[0])
        return JSONResponse(
            {"error": "Events are unavailable. Please try again later."},
            status_code=503,
            headers=headers,
        )


# Explicit public routes keep .env and SQL files inaccessible.
@app.get("/", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
def index():
    return FileResponse(ROOT / "frontend" / "index.html")


@app.get("/style.css", include_in_schema=False)
def styles():
    return FileResponse(ROOT / "frontend" / "style.css", media_type="text/css")


@app.get("/app.js", include_in_schema=False)
def javascript():
    return FileResponse(ROOT / "frontend" / "app.js", media_type="text/javascript")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("PORT", "3000")))
