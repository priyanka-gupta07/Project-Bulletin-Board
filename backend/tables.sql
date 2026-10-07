CREATE DATABASE CollegeEventDB;

USE CollegeEventDB;


CREATE TABLE Event(
    Event_ID INT PRIMARY KEY,
    Event_Name VARCHAR(50) NOT NULL,
    Start_Date DATE,
    End_Date DATE,
    Eligibility VARCHAR(50),
    Max_participants INT,
    Registration_FEE DECIMAL(8,2),
    Venue_Name VARCHAR(50),
    Location VARCHAR(50),
    Capacity INT,
    Registration_Link VARCHAR(500)
);

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


CREATE TABLE Volunteer(
    v_id INT PRIMARY KEY,
    v_name VARCHAR(50) NOT NULL,
    v_contact VARCHAR(15)
);


CREATE TABLE Team(
    T_ID INT PRIMARY KEY,
    T_NAME VARCHAR(50) NOT NULL,
    T_CLG_NAME VARCHAR(50)
);


CREATE TABLE Participant(
    Part_ID INT PRIMARY KEY,
    Part_name VARCHAR(50) NOT NULL,
    DOB DATE,
    college VARCHAR(50),
    T_ID INT,
    FOREIGN KEY (T_ID) REFERENCES Team(T_ID)
);


ALTER TABLE Team
ADD Captain_ID INT UNIQUE;


ALTER TABLE Team
ADD FOREIGN KEY (Captain_ID) REFERENCES Participant(Part_ID);


CREATE TABLE Prize(
    Event_ID INT,
    p_id INT,
    p_name VARCHAR(50),
    p_amount DECIMAL(8,2),
    p_points INT,
    PRIMARY KEY (Event_ID, p_id),
    FOREIGN KEY (Event_ID) REFERENCES Event(Event_ID)
);


CREATE TABLE Helps_Manage(
    Event_ID INT,
    v_id INT,
    PRIMARY KEY (Event_ID, v_id),
    FOREIGN KEY (Event_ID) REFERENCES Event(Event_ID),
    FOREIGN KEY (v_id) REFERENCES Volunteer(v_id)
);


CREATE TABLE Team_Participates(
    Event_ID INT,
    T_ID INT,
    PRIMARY KEY (Event_ID, T_ID),
    FOREIGN KEY (Event_ID) REFERENCES Event(Event_ID),
    FOREIGN KEY (T_ID) REFERENCES Team(T_ID)
);


CREATE TABLE Participates(
    Event_ID INT,
    Part_ID INT,
    PRIMARY KEY (Event_ID, Part_ID),
    FOREIGN KEY (Event_ID) REFERENCES Event(Event_ID),
    FOREIGN KEY (Part_ID) REFERENCES Participant(Part_ID)
);


CREATE TABLE Participant_Contact(
    Part_ID INT,
    contact VARCHAR(15),
    PRIMARY KEY (Part_ID, contact),
    FOREIGN KEY (Part_ID) REFERENCES Participant(Part_ID)
);
