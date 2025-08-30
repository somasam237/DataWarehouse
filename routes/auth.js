const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  console.log('Registration request received:', { name: req.body.name, email: req.body.email });
  console.log('Request body:', req.body);
  const { name, email, password } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
    return res.status(400).json({ error: "All fields are required" });
  }
  
  try {
    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 1. Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 2. Generate email verification token (secure random)
    const emailToken = crypto.randomBytes(48).toString("hex");

    // 3. Save user with token and unverified status
    const result = await pool.query(
      "INSERT INTO users (name, email, password, email_token, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email",
      [name, email, hashed, emailToken, false]
    );

    const user = result.rows[0];

    // 4. Send verification email (if email service is configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const url = `http://localhost:3000/verify-email?token=${emailToken}`;
        await transporter.sendMail({
          to: email,
          subject: "Welcome to Protein Data Warehouse!",
          html: `
            <h2>Welcome to Protein Data Warehouse!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for registering with Protein Data Warehouse. Please confirm your email address by clicking the link below:</p>
            <a href="${url}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
            <p>If you did not create this account, please ignore this email.</p>
            <p>Best regards,<br>The Protein Data Warehouse Team</p>
          `,
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue with registration even if email fails
      }
    }

    // 5. Return success response
    res.json({ 
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    if (err.code === '23505') {
      res.status(400).json({ error: "Email already registered" });
    } else {
      res.status(500).json({ error: "Server error during registration", details: err.message });
    }
  }
});

// Email verification endpoint
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  try {
    const result = await pool.query(
      "UPDATE users SET email_verified = true, email_token = NULL WHERE email_token = $1 RETURNING *",
      [token]
    );
    if (result.rowCount === 0) {
      return res.status(400).send("Invalid or expired token.");
    }
    res.send("Email verified! You can now log in.");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Check if email is verified (optional for now)
    // if (!user.email_verified) {
    //   return res.status(400).json({ error: "Please verify your email before logging in" });
    // }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    console.log('Using JWT secret:', jwtSecret ? 'Secret is set' : 'Using default secret');
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "24h" });
    res.json({ 
      message: "Login successful", 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Request password reset
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [resetToken, resetTokenExpiry, email]
    );

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const url = `http://localhost:3000/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        to: email,
        subject: "Password Reset - Protein Data Warehouse",
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Protein Data Warehouse account.</p>
          <a href="${url}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        `,
      });
    }

    res.json({ message: "Password reset email sent." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > $2",
      [token, Date.now()]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = $2",
      [hashed, token]
    );
    res.json({ message: "Password reset successful." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
