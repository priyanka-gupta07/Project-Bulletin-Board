"""Serve the bulletin board and its MySQL events API."""

import logging
import os
import ssl
from datetime import date
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import pymysql
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import AnyHttpUrl, BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env", interpolate=False)
app = FastAPI(title="Bulletin Board API")
logger = logging.getLogger(__name__)


def database_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "CollegeEventDB"),
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5,
        read_timeout=5,
        autocommit=True,
        ssl=ssl.create_default_context(cafile=os.environ["DB_SSL_CA"])
        if os.getenv("DB_SSL_CA") else None,
    )


class UserEventInput(BaseModel):
    owner_id: UUID
    event_name: str = Field(min_length=1, max_length=50)
    start_date: date
    eligibility: str | None = Field(default=None, max_length=50)
    registration_fee: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    registration_link: AnyHttpUrl | None = Field(default=None, max_length=500)
    venue_name: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=50)


@app.get("/api/events")
def events(owner_id: UUID | None = Query(default=None)):
    headers = {"Cache-Control": "no-store"}
    try:
        with database_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT Event_ID, Event_Name, Start_Date, End_Date, Eligibility,
                           Registration_FEE, Venue_Name, Location, Max_participants,
                           Registration_Link
                    FROM Event
                    WHERE COALESCE(End_Date, Start_Date) >= CURDATE()
                       OR (Start_Date IS NULL AND End_Date IS NULL)
                    ORDER BY Start_Date IS NULL, Start_Date, Event_ID
                """)
                rows = cursor.fetchall()
                for row in rows:
                    row["Is_Own_Event"] = False
                cursor.execute("""
                    SELECT -Event_ID AS Event_ID, Event_Name, Start_Date,
                           Start_Date AS End_Date, Eligibility,
                           Registration_FEE, Venue_Name, Location, Registration_Link,
                           NULL AS Max_participants,
                           (Owner_ID = %s) AS Is_Own_Event
                    FROM User_Event
                    WHERE Start_Date >= CURDATE()
                    ORDER BY Start_Date, Event_ID
                """, (str(owner_id) if owner_id else "",))
                rows.extend(cursor.fetchall())

        rows.sort(key=lambda row: (
            row["Start_Date"] is None,
            row["Start_Date"] or date.max,
            row["Event_ID"],
        ))
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


@app.post("/api/events", status_code=201)
def create_event(event: UserEventInput):
    headers = {"Cache-Control": "no-store"}
    try:
        with database_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO User_Event
                        (Owner_ID, Event_Name, Start_Date, Eligibility,
                         Registration_FEE, Venue_Name, Location, Registration_Link)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    str(event.owner_id), event.event_name.strip(), event.start_date,
                    event.eligibility, event.registration_fee, event.venue_name,
                    event.location, str(event.registration_link) if event.registration_link else None,
                ))
                event_id = cursor.lastrowid
        result = {
            "Event_ID": -event_id,
            "Event_Name": event.event_name.strip(),
            "Start_Date": event.start_date.isoformat(),
            "End_Date": event.start_date.isoformat(),
            "Eligibility": event.eligibility,
            "Registration_FEE": str(event.registration_fee) if event.registration_fee is not None else None,
            "Registration_Link": str(event.registration_link) if event.registration_link else None,
            "Venue_Name": event.venue_name,
            "Location": event.location,
            "Max_participants": None,
            "Is_Own_Event": True,
        }
        return JSONResponse(jsonable_encoder(result), status_code=201, headers=headers)
    except pymysql.MySQLError as error:
        logger.error("Could not add event; database error code: %s", error.args[0])
        return JSONResponse(
            {"error": "The event could not be saved. Please try again."},
            status_code=503,
            headers=headers,
        )


@app.delete("/api/events/{event_id}", status_code=204)
def delete_event(event_id: int, owner_id: UUID):
    headers = {"Cache-Control": "no-store"}
    if event_id >= 0:
        return JSONResponse({"error": "Only your own events can be deleted."}, status_code=404, headers=headers)
    try:
        with database_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM User_Event WHERE Event_ID = %s AND Owner_ID = %s",
                    (-event_id, str(owner_id)),
                )
                deleted = cursor.rowcount
        if not deleted:
            return JSONResponse({"error": "Event not found."}, status_code=404, headers=headers)
        return Response(status_code=204, headers=headers)
    except pymysql.MySQLError as error:
        logger.error("Could not delete event; database error code: %s", error.args[0])
        return JSONResponse(
            {"error": "The event could not be deleted. Please try again."},
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
