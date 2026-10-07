-- INSERTING SAMPLE DATA

INSERT INTO Event
(Event_ID, Event_Name, Start_Date, End_Date, Eligibility,
 Max_participants, Registration_FEE, Venue_Name, Location, Capacity, Registration_Link)
VALUES
(101, 'CodeSprint', '2026-10-05', '2026-10-05',
 'College Students', 50, 100.00, 'Computer Lab', 'Block A', 60, 'https://example.com/register/codesprint'),

(102, 'Robotics Challenge', '2026-10-10', '2026-10-10',
 'Engineering Students', 40, 200.00, 'Innovation Lab', 'Block B', 50, 'https://example.com/register/robotics-challenge'),

(103, 'Debate Championship', '2026-10-15', '2026-10-15',
 'All Students', 30, 50.00, 'Seminar Hall', 'Block C', 40, 'https://example.com/register/debate-championship'),
(104, 'AI & Machine Learning Workshop', '2026-10-22', '2026-10-22',
 'All Students', 45, 150.00, 'Innovation Lab', 'Block B', 50, 'https://example.com/register/ai-workshop'),
(105, 'Campus Garba Night', '2026-10-28', '2026-10-28',
 'All Students', 200, 0.00, 'Open Air Theatre', 'Main Campus', 250, 'https://example.com/register/garba-night'),
(106, 'Intercollege Cricket Cup', '2026-11-03', '2026-11-05',
 'College Teams', 120, 500.00, 'Sports Ground', 'Main Campus', 150, 'https://example.com/register/cricket-cup'),
(107, 'Startup Conclave', '2026-11-12', '2026-11-12',
 'All Students', 100, 250.00, 'Auditorium', 'Block C', 120, 'https://example.com/register/startup-conclave'),
(108, 'Photography Challenge', '2026-11-18', '2026-11-25',
 'All Students', 80, 0.00, 'Online', 'Virtual', 100, 'https://example.com/register/photography-challenge'),
(109, 'Web Development Bootcamp', '2026-11-21', '2026-11-22',
 'All Students', 35, 300.00, 'Computer Lab', 'Block A', 40, 'https://example.com/register/web-bootcamp'),
(110, 'Community Clean-Up Drive', '2026-12-05', '2026-12-05',
 'All Students', 60, 0.00, 'Main Gate', 'Main Campus', 80, 'https://example.com/register/clean-up'),
(111, 'Valorant Gaming Tournament', '2026-12-12', '2026-12-12',
 'College Students', 32, 100.00, 'Gaming Arena', 'Student Centre', 40, 'https://example.com/register/valorant'),
(112, 'Annual Music & Arts Festival', '2027-01-16', '2027-01-17',
 'All Students', 300, 0.00, 'Open Air Theatre', 'Main Campus', 400, 'https://example.com/register/music-arts-festival'),
(113, 'National Science Quiz', '2027-02-06', '2027-02-06',
 'College Students', 64, 50.00, 'Seminar Hall', 'Block C', 80, 'https://example.com/register/science-quiz');
 
INSERT INTO Volunteer
(v_id, v_name, v_contact)
VALUES
(1, 'Aarav Sharma', '9876500011'),
(2, 'Riya Mehta', '9876500012'),
(3, 'Kabir Singh', '9876500013');

INSERT INTO Team
(T_ID, T_NAME, T_CLG_NAME)
VALUES
(201, 'Code Warriors', 'ABC College'),
(202, 'Tech Titans', 'XYZ Institute'),
(203, 'Robo Masters', 'PQR University');

INSERT INTO Participant
(Part_ID, Part_name, DOB, college, T_ID)
VALUES
(301, 'Aditi Shah', '2005-03-12', 'ABC College', 201),
(302, 'Rahul Verma', '2004-07-21', 'ABC College', 201),

(303, 'Sneha Kapoor', '2005-01-15', 'XYZ Institute', 202),
(304, 'Arjun Nair', '2004-11-08', 'XYZ Institute', 202),

(305, 'Meera Iyer', '2005-06-19', 'PQR University', 203),
(306, 'Karan Malhotra', '2004-09-25', 'PQR University', 203);


UPDATE Team
SET Captain_ID = 301
WHERE T_ID = 201;

UPDATE Team
SET Captain_ID = 303
WHERE T_ID = 202;

UPDATE Team
SET Captain_ID = 305
WHERE T_ID = 203;

INSERT INTO Prize
(Event_ID, p_id, p_name, p_amount, p_points)
VALUES
(101, 1, 'First Prize', 5000.00, 10),
(101, 2, 'Second Prize', 3000.00, 6),

(102, 1, 'First Prize', 8000.00, 10),
(102, 2, 'Second Prize', 5000.00, 6),

(103, 1, 'First Prize', 3000.00, 10);

INSERT INTO Helps_Manage
(Event_ID, v_id)
VALUES
(101, 1),
(101, 2),
(102, 2),
(102, 3),
(103, 3);

INSERT INTO Team_Participates
(Event_ID, T_ID)
VALUES
(101, 201),
(101, 202),

(102, 202),
(102, 203),

(103, 201),
(103, 203);


INSERT INTO Participates
(Event_ID, Part_ID)
VALUES
(101, 301),
(101, 302),
(101, 303),

(102, 303),
(102, 304),
(102, 305),

(103, 301),
(103, 305),
(103, 306);


INSERT INTO Participant_Contact
(Part_ID, contact)
VALUES
(301, '9876501011'),
(302, '9876501012'),
(303, '9876501013'),
(304, '9876501014'),
(305, '9876501015'),
(306, '9876501016'),

(301, '9123401011');

SELECT * FROM Event;
SELECT * FROM Volunteer;
SELECT * FROM Team;
SELECT * FROM Participant;
SELECT * FROM Prize;
SELECT * FROM Helps_Manage;
SELECT * FROM Team_Participates;
SELECT * FROM Participates;
SELECT * FROM Participant_Contact;

-- 1. Display event names and the participants registered for them
SELECT Event.Event_Name, Participant.Part_name
FROM Event
JOIN Participates
ON Event.Event_ID = Participates.Event_ID
JOIN Participant
ON Participates.Part_ID = Participant.Part_ID;


-- 2. Display events and the teams participating in them
SELECT Event.Event_Name, Team.T_NAME
FROM Event
JOIN Team_Participates
ON Event.Event_ID = Team_Participates.Event_ID
JOIN Team
ON Team_Participates.T_ID = Team.T_ID;

-- 3. Display events and the volunteers managing them
SELECT Event.Event_Name, Volunteer.v_name
FROM Event
JOIN Helps_Manage
ON Event.Event_ID = Helps_Manage.Event_ID
JOIN Volunteer
ON Helps_Manage.v_id = Volunteer.v_id;

-- 4. Display participants and their team names

SELECT Participant.Part_name, Team.T_NAME
FROM Participant
JOIN Team
ON Participant.T_ID = Team.T_ID;

-- AGGREGATE FUNCTIONS

-- 5. Count the number of participants in each event
SELECT Event_ID, COUNT(Part_ID) AS Total_Participants
FROM Participates
GROUP BY Event_ID;

-- 6. Count volunteers managing each event
SELECT Event_ID, COUNT(v_id) AS Total_Volunteers
FROM Helps_Manage
GROUP BY Event_ID;

-- 7. Find the total prize money for each event
SELECT Event_ID, SUM(p_amount) AS Total_Prize_Money
FROM Prize
GROUP BY Event_ID;

-- 8. Find the average registration fee
SELECT AVG(Registration_FEE) AS Average_Fee
FROM Event;

-- 9. Find the highest and lowest prize amounts
SELECT 
    MAX(p_amount) AS Highest_Prize,
    MIN(p_amount) AS Lowest_Prize
FROM Prize;

-- 10. Find events whose registration fee is above the average fee
SELECT Event_Name, Registration_FEE
FROM Event
WHERE Registration_FEE > (
    SELECT AVG(Registration_FEE)
    FROM Event
);

-- 11. Find participants who participated in more than one event
SELECT Part_name
FROM Participant
WHERE Part_ID IN (
    SELECT Part_ID
    FROM Participates
    GROUP BY Part_ID
    HAVING COUNT(Event_ID) > 1
);

-- 12. Find the event containing the highest prize
SELECT Event_Name
FROM Event
WHERE Event_ID = (
    SELECT Event_ID
    FROM Prize
    WHERE p_amount = (
        SELECT MAX(p_amount)
        FROM Prize
    )
);
