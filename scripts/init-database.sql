-- MySQL Database Initialization Script
-- Run this script to create all global tables

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS admin_panel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE admin_panel_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'USER', 'SUPER_ADMIN') DEFAULT 'USER',
  shopName VARCHAR(255),
  contactNumber VARCHAR(255),
  address VARCHAR(500),
  companyEmail VARCHAR(255),
  website VARCHAR(255),
  tenantId VARCHAR(36) UNIQUE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_tenantId (tenantId),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  plan ENUM('MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'TWELVE_MONTH') NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'FREE_TRIAL') DEFAULT 'FREE_TRIAL',
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  price DECIMAL(10, 2),
  paymentStatus ENUM('PENDING', 'APPROVED', 'REJECTED'),
  paymentId VARCHAR(255),
  isFreeTrial BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_tenantId (tenantId),
  INDEX idx_status (status),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription History table
CREATE TABLE IF NOT EXISTS subscription_history (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  plan ENUM('MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'TWELVE_MONTH') NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'FREE_TRIAL') NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  price DECIMAL(10, 2),
  paymentStatus ENUM('PENDING', 'APPROVED', 'REJECTED'),
  paymentId VARCHAR(255),
  isFreeTrial BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_tenantId (tenantId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login History table
CREATE TABLE IF NOT EXISTS login_history (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45),
  INDEX idx_userId (userId),
  INDEX idx_tenantId (tenantId),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  plan ENUM('MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'TWELVE_MONTH') NOT NULL,
  planName VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  months INT NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_tenantId (tenantId),
  INDEX idx_status (status),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Testimonials/Comments table
CREATE TABLE IF NOT EXISTS testimonials (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  img VARCHAR(500),
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create super admin user (password: superadmin123 - hashed with bcrypt)
-- Default password hash for 'superadmin123' (you should change this)
INSERT INTO users (id, name, email, password, role, shopName, contactNumber, tenantId)
VALUES (
  UUID(),
  'Super Admin',
  'superadmin@admin.com',
  '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- Change this to actual bcrypt hash
  'SUPER_ADMIN',
  'System Administration',
  'N/A',
  UUID()
)
ON DUPLICATE KEY UPDATE email=email;
