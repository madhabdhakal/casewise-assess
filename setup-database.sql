-- Connect to PostgreSQL as superuser and run this script
-- psql -U postgres -f setup-database.sql

CREATE DATABASE casewise_assess
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;