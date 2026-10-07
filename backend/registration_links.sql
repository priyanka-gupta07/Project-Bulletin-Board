-- Run once on an existing database whose Event table already has this column.
ALTER TABLE User_Event
ADD COLUMN Registration_Link VARCHAR(500);
