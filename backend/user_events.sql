-- Run once to enable creating and deleting user events in an existing database.
CREATE TABLE IF NOT EXISTS User_Event(
    Event_ID INT AUTO_INCREMENT PRIMARY KEY,
    Owner_ID CHAR(36) NOT NULL,
    Event_Name VARCHAR(50) NOT NULL,
    Start_Date DATE NOT NULL,
    Eligibility VARCHAR(50),
    Registration_FEE DECIMAL(8,2),
    Venue_Name VARCHAR(50),
    Location VARCHAR(50),
    Registration_Link VARCHAR(500),
    INDEX idx_user_event_start_date (Start_Date)
);
