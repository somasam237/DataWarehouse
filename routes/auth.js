const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // 1. Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 2. Generate email verification token (secure random)
    const emailToken = crypto.randomBytes(48).toString("hex");

    // 3. Save user with token and unverified status
    await pool.query(
      "INSERT INTO users (name, email, password, email_token, email_verified) VALUES ($1, $2, $3, $4, $5)",
      [name, email, hashed, emailToken, false]
    );

    // 4. Send verification email
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
      subject: "Verify your email address",
      html: `
        <h2>Welcome to DataWarehouse2025!</h2>
        <p>Thank you for registering. Please confirm your email address by clicking the link below:</p>
        <a href="${url}">Verify Email</a>
        <p>If you did not create this account, please ignore this email.</p>
      `,
    });

    // 5. Always send a generic message for security
    res.json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (err) {
    if (err.code === '23505') {
      // Do not reveal if email is taken
      res.status(400).json({ error: "Registration failed. Please check your details." });
    } else {
      res.status(500).json({ error: "Server error" });
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

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const url = `http://localhost:3000/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

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
