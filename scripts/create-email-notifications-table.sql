-- Create email_notifications table to track sent emails
-- This prevents duplicate email notifications

USE admin_panel_db;

CREATE TABLE IF NOT EXISTS email_notifications (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  notificationType VARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_notificationType (notificationType),
  INDEX idx_createdAt (createdAt),
  UNIQUE KEY unique_notification (userId, notificationType, DATE(createdAt)),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

