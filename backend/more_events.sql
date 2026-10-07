-- Add the newer sample events to an existing CollegeEventDB.
-- Safe to run repeatedly: matching event IDs are updated in place.

INSERT INTO Event
(Event_ID, Event_Name, Start_Date, End_Date, Eligibility,
 Max_participants, Registration_FEE, Venue_Name, Location, Capacity, Registration_Link)
VALUES
(104, 'AI & Machine Learning Workshop', '2026-10-22', '2026-10-22', 'All Students', 45, 150.00, 'Innovation Lab', 'Block B', 50, 'https://example.com/register/ai-workshop'),
(105, 'Campus Garba Night', '2026-10-28', '2026-10-28', 'All Students', 200, 0.00, 'Open Air Theatre', 'Main Campus', 250, 'https://example.com/register/garba-night'),
(106, 'Intercollege Cricket Cup', '2026-11-03', '2026-11-05', 'College Teams', 120, 500.00, 'Sports Ground', 'Main Campus', 150, 'https://example.com/register/cricket-cup'),
(107, 'Startup Conclave', '2026-11-12', '2026-11-12', 'All Students', 100, 250.00, 'Auditorium', 'Block C', 120, 'https://example.com/register/startup-conclave'),
(108, 'Photography Challenge', '2026-11-18', '2026-11-25', 'All Students', 80, 0.00, 'Online', 'Virtual', 100, 'https://example.com/register/photography-challenge'),
(109, 'Web Development Bootcamp', '2026-11-21', '2026-11-22', 'All Students', 35, 300.00, 'Computer Lab', 'Block A', 40, 'https://example.com/register/web-bootcamp'),
(110, 'Community Clean-Up Drive', '2026-12-05', '2026-12-05', 'All Students', 60, 0.00, 'Main Gate', 'Main Campus', 80, 'https://example.com/register/clean-up'),
(111, 'Valorant Gaming Tournament', '2026-12-12', '2026-12-12', 'College Students', 32, 100.00, 'Gaming Arena', 'Student Centre', 40, 'https://example.com/register/valorant'),
(112, 'Annual Music & Arts Festival', '2027-01-16', '2027-01-17', 'All Students', 300, 0.00, 'Open Air Theatre', 'Main Campus', 400, 'https://example.com/register/music-arts-festival'),
(113, 'National Science Quiz', '2027-02-06', '2027-02-06', 'College Students', 64, 50.00, 'Seminar Hall', 'Block C', 80, 'https://example.com/register/science-quiz')
ON DUPLICATE KEY UPDATE
    Event_Name = VALUES(Event_Name),
    Start_Date = VALUES(Start_Date),
    End_Date = VALUES(End_Date),
    Eligibility = VALUES(Eligibility),
    Max_participants = VALUES(Max_participants),
    Registration_FEE = VALUES(Registration_FEE),
    Venue_Name = VALUES(Venue_Name),
    Location = VALUES(Location),
    Capacity = VALUES(Capacity),
    Registration_Link = VALUES(Registration_Link);
