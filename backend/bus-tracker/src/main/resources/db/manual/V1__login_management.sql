-- Run once against the existing bus_tracker database before starting the updated application.
-- Existing users keep their email and can continue signing in with it.
ALTER TABLE users
    MODIFY COLUMN email VARCHAR(180) NULL,
    ADD COLUMN login_id VARCHAR(80) NULL;

-- Preserve legacy login compatibility by using the existing email as the initial Login ID.
UPDATE users
SET login_id = LOWER(email)
WHERE email IS NOT NULL AND login_id IS NULL;

CREATE UNIQUE INDEX uk_users_login_id ON users (login_id);

-- Driver.user_id already exists in this project. Match Hibernate's MySQL UUID storage for students.
ALTER TABLE students
    ADD COLUMN user_id BINARY(16) NULL;

CREATE UNIQUE INDEX uk_student_user_id ON students (user_id);
