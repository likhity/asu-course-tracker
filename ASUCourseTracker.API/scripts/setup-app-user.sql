-- SQL script to set up limited permissions for application user
-- Run this as postgres/master user after migrations have created tables

-- Create application user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'asu_course_tracker') THEN
        CREATE USER asu_course_tracker WITH PASSWORD 'your-app-user-password';
    END IF;
END
$$;

-- Grant connection to database
GRANT CONNECT ON DATABASE asu_course_tracker TO asu_course_tracker;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO asu_course_tracker;

-- Grant SELECT, INSERT, UPDATE, DELETE on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO asu_course_tracker;

-- Grant usage on sequences (for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO asu_course_tracker;

-- Set default privileges for future tables (created by migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO asu_course_tracker;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE ON SEQUENCES TO asu_course_tracker;

-- Verify permissions
\dp  -- Show table permissions
