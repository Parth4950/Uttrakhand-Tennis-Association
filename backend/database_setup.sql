
-- Create database
CREATE DATABASE IF NOT EXISTS tennis_association;
USE tennis_association;

-- Create tbl_eventname table
CREATE TABLE tbl_eventname (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tbl_players table
CREATE TABLE tbl_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    email VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    shirt_size VARCHAR(10),
    short_size VARCHAR(10),
    food_pref VARCHAR(255),
    stay_y_or_n BOOLEAN DEFAULT FALSE,
    fee_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tbl_partners table
CREATE TABLE tbl_partners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    partner_id INT NULL,
    ranking INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_name) REFERENCES tbl_eventname(event_name) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tbl_players(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES tbl_players(id) ON DELETE SET NULL,
    CONSTRAINT chk_no_self_partner CHECK (user_id != partner_id OR partner_id IS NULL)
);

-- Create indexes for better performance
CREATE INDEX idx_partners_event_user ON tbl_partners(event_name, user_id);
CREATE INDEX idx_partners_event_partner ON tbl_partners(event_name, partner_id);

-- Insert some sample events
INSERT INTO tbl_eventname (event_name) VALUES 
('Men\'s Singles'),
('Women\'s Singles'),
('Men\'s Doubles'),
('Women\'s Doubles'),
('Mixed Doubles');

-- Function to check if a player already exists with same WhatsApp and DOB
DELIMITER //
CREATE FUNCTION CheckPlayerExists(
    p_whatsapp VARCHAR(20),
    p_dob DATE
)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE player_exists BOOLEAN DEFAULT FALSE;
    
    SELECT EXISTS(
        SELECT 1 FROM tbl_players 
        WHERE whatsapp_number = p_whatsapp 
        AND date_of_birth = p_dob
    ) INTO player_exists;
    
    RETURN player_exists;
END //
DELIMITER ;

-- Stored procedure to get available partners for an event
DELIMITER //
CREATE PROCEDURE GetAvailablePartners(
    IN event_name_param VARCHAR(255),
    IN current_user_id INT
)
BEGIN
    SELECT 
        p.id as user_id,
        p.name as player_name,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM tbl_partners tp 
                WHERE tp.event_name = event_name_param 
                AND tp.user_id = p.id 
                AND tp.partner_id IS NOT NULL
            ) THEN TRUE
            ELSE FALSE
        END as has_partner
    FROM tbl_players p
    WHERE p.id IN (
        SELECT tp.user_id 
        FROM tbl_partners tp 
        WHERE tp.event_name = event_name_param
        AND tp.user_id != current_user_id
    );
END //
DELIMITER ;

-- Stored procedure to update partner relationship
DELIMITER //
CREATE PROCEDURE UpdatePartnerRelationship(
    IN event_name_param VARCHAR(255),
    IN user1_id INT,
    IN user2_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update user1's partner to user2
    UPDATE tbl_partners 
    SET partner_id = user2_id 
    WHERE event_name = event_name_param AND user_id = user1_id;
    
    -- Check if user2 has an entry for this event
    IF NOT EXISTS (
        SELECT 1 FROM tbl_partners 
        WHERE event_name = event_name_param AND user_id = user2_id
    ) THEN
        -- Create entry for user2 if doesn't exist
        INSERT INTO tbl_partners (event_name, user_id, partner_id)
        VALUES (event_name_param, user2_id, user1_id);
    ELSE
        -- Update user2's partner to user1
        UPDATE tbl_partners 
        SET partner_id = user1_id 
        WHERE event_name = event_name_param AND user_id = user2_id;
    END IF;
    
    COMMIT;
END //
DELIMITER ;

-- Function to check if a player is already registered for an event
DELIMITER //
CREATE FUNCTION IsPlayerRegisteredForEvent(
    player_id INT,
    event_name_param VARCHAR(255)
)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_registered BOOLEAN DEFAULT FALSE;
    
    SELECT EXISTS(
        SELECT 1 FROM tbl_partners 
        WHERE user_id = player_id AND event_name = event_name_param
    ) INTO is_registered;
    
    RETURN is_registered;
END //
DELIMITER ;

-- Stored procedure to register a player for events
DELIMITER //
CREATE PROCEDURE RegisterPlayerForEvents(
    IN player_id INT,
    IN event1_name VARCHAR(255),
    IN partner1_id INT,
    IN event2_name VARCHAR(255),
    IN partner2_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Register for event 1 if provided
    IF event1_name IS NOT NULL AND event1_name != '' THEN
        IF NOT IsPlayerRegisteredForEvent(player_id, event1_name) THEN
            INSERT INTO tbl_partners (event_name, user_id, partner_id)
            VALUES (event1_name, player_id, partner1_id);
            
            -- Update partner relationship if partner is selected
            IF partner1_id IS NOT NULL THEN
                CALL UpdatePartnerRelationship(event1_name, player_id, partner1_id);
            END IF;
        END IF;
    END IF;
    
    -- Register for event 2 if provided
    IF event2_name IS NOT NULL AND event2_name != '' THEN
        IF NOT IsPlayerRegisteredForEvent(player_id, event2_name) THEN
            INSERT INTO tbl_partners (event_name, user_id, partner_id)
            VALUES (event2_name, player_id, partner2_id);
            
            -- Update partner relationship if partner is selected
            IF partner2_id IS NOT NULL THEN
                CALL UpdatePartnerRelationship(event2_name, player_id, partner2_id);
            END IF;
        END IF;
    END IF;
    
    COMMIT;
END //
DELIMITER ;

-- View to get complete player information with their events
CREATE VIEW player_events_view AS
SELECT 
    p.id as player_id,
    p.name as player_name,
    p.whatsapp_number,
    p.email,
    p.city,
    pt.event_name,
    pt.partner_id,
    partner.name as partner_name,
    pt.ranking,
    pt.created_at as registration_date
FROM tbl_players p
LEFT JOIN tbl_partners pt ON p.id = pt.user_id
LEFT JOIN tbl_players partner ON pt.partner_id = partner.id
ORDER BY p.name, pt.event_name;

-- View to get event statistics
CREATE VIEW event_statistics AS
SELECT 
    e.event_name,
    COUNT(DISTINCT pt.user_id) as total_players,
    COUNT(CASE WHEN pt.partner_id IS NOT NULL THEN 1 END) as paired_players,
    COUNT(CASE WHEN pt.partner_id IS NULL THEN 1 END) as unpaired_players
FROM tbl_eventname e
LEFT JOIN tbl_partners pt ON e.event_name = pt.event_name
GROUP BY e.event_name
ORDER BY e.event_name;

-- Trigger to prevent duplicate registrations
DELIMITER //
CREATE TRIGGER prevent_duplicate_registration
BEFORE INSERT ON tbl_partners
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM tbl_partners 
        WHERE user_id = NEW.user_id AND event_name = NEW.event_name
    ) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Player is already registered for this event';
    END IF;
END //
DELIMITER ;

-- Stored procedure to get player dashboard data
DELIMITER //
CREATE PROCEDURE GetPlayerDashboard(
    IN player_id INT
)
BEGIN
    -- Get player basic info
    SELECT * FROM tbl_players WHERE id = player_id;
    
    -- Get player's events and partners
    SELECT 
        pt.event_name,
        pt.partner_id,
        CASE 
            WHEN pt.partner_id IS NOT NULL THEN partner.name
            ELSE 'No partner assigned'
        END as partner_name,
        pt.ranking
    FROM tbl_partners pt
    LEFT JOIN tbl_players partner ON pt.partner_id = partner.id
    WHERE pt.user_id = player_id
    ORDER BY pt.event_name;
END //
DELIMITER ;

-- Stored procedure for admin to get all registrations
DELIMITER //
CREATE PROCEDURE GetAllRegistrations()
BEGIN
    SELECT * FROM player_events_view ORDER BY player_name, event_name;
END //
DELIMITER ;