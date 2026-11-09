-- Adds the Bus Assignment Stop Mapping menu for School Admin users.
-- Idempotent: safe to execute more than once.
-- Menu table columns are based on MenusEntity.

INSERT INTO menus (name, path, menus_for, parent_menu_id, sequences, icon, active)
SELECT
    'Bus Assignment Stops',
    '/bus-assignment-stops',
    'SCHOOL_ADMIN',
    NULL,
    9,
    'map-pinned',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM menus
    WHERE path = '/bus-assignment-stops'
      AND menus_for = 'SCHOOL_ADMIN'
);

-- Verify:
-- SELECT id, name, path, menus_for, sequences, icon, active
-- FROM menus
-- WHERE path = '/bus-assignment-stops';
