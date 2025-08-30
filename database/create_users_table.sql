-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on email_token for verification
CREATE INDEX IF NOT EXISTS idx_users_email_token ON users(email_token);

-- Create index on reset_token for password reset
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token); 