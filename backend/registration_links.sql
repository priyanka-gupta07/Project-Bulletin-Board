-- Add Registration_Link columns to existing databases when they are missing.
SET @registration_link_event_sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Event'
       AND COLUMN_NAME = 'Registration_Link') = 0,
    'ALTER TABLE Event ADD COLUMN Registration_Link VARCHAR(500)',
    'SELECT 1'
);
PREPARE registration_link_event_stmt FROM @registration_link_event_sql;
EXECUTE registration_link_event_stmt;
DEALLOCATE PREPARE registration_link_event_stmt;

SET @registration_link_user_event_sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User_Event'
       AND COLUMN_NAME = 'Registration_Link') = 0,
    'ALTER TABLE User_Event ADD COLUMN Registration_Link VARCHAR(500)',
    'SELECT 1'
);
PREPARE registration_link_user_event_stmt FROM @registration_link_user_event_sql;
EXECUTE registration_link_user_event_stmt;
DEALLOCATE PREPARE registration_link_user_event_stmt;
