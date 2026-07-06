-- ============================================================
-- ZAIKA LOUNGE - COMPLETE DATABASE SCHEMA (MySQL 5.7+/8.0+)
-- For Hostinger phpMyAdmin import
-- All foreign keys added at the end via ALTER TABLE to avoid
-- errno 150 "Foreign key constraint is incorrectly formed"
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = '';

-- ============================================================
-- BASE TABLES (V1) — no inline FK constraints
-- ============================================================

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `image_url` VARCHAR(500),
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin','manager','staff') DEFAULT 'staff',
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20),
  `password_hash` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(500),
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `wallet_balance` DECIMAL(10,2) DEFAULT 0.00,
  `loyalty_points_total` INT DEFAULT 0,
  `referral_code` VARCHAR(20),
  `date_of_birth` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `label` VARCHAR(50) DEFAULT 'Home',
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address_line` TEXT NOT NULL,
  `landmark` VARCHAR(255),
  `city` VARCHAR(100) DEFAULT 'Muzaffarnagar',
  `state` VARCHAR(100) DEFAULT 'Uttar Pradesh',
  `pincode` VARCHAR(10) NOT NULL,
  `latitude` DECIMAL(10,7),
  `longitude` DECIMAL(10,7),
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `ingredients` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `discount_price` DECIMAL(10,2) NULL,
  `image_url` VARCHAR(500),
  `is_veg` TINYINT(1) DEFAULT 1,
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_best_seller` TINYINT(1) DEFAULT 0,
  `is_combo` TINYINT(1) DEFAULT 0,
  `combo_items` JSON NULL,
  `combo_discount_percent` DECIMAL(5,2) DEFAULT 0.00,
  `preparation_time` INT DEFAULT 20,
  `rating` DECIMAL(2,1) DEFAULT 4.0,
  `sort_order` INT DEFAULT 0,
  `stock_status` ENUM('in_stock','out_of_stock') DEFAULT 'in_stock',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_zones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `area_name` VARCHAR(255),
  `pincode` VARCHAR(10) NOT NULL,
  `delivery_charge` DECIMAL(10,2) DEFAULT 0.00,
  `min_order_value` DECIMAL(10,2) DEFAULT 0.00,
  `estimated_minutes` INT DEFAULT 30,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `discount_type` ENUM('percentage','flat') DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_order_value` DECIMAL(10,2) DEFAULT 0.00,
  `max_discount` DECIMAL(10,2) NULL,
  `usage_limit` INT DEFAULT 0,
  `used_count` INT DEFAULT 0,
  `starts_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_public` TINYINT(1) DEFAULT 1,
  `customer_email` VARCHAR(255),
  `customer_phone` VARCHAR(20),
  `customer_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) UNIQUE,
  `customer_id` INT NOT NULL,
  `address_id` INT,
  `delivery_name` VARCHAR(255) NOT NULL,
  `delivery_phone` VARCHAR(20) NOT NULL,
  `delivery_address` TEXT NOT NULL,
  `delivery_landmark` VARCHAR(255),
  `delivery_pincode` VARCHAR(10) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `delivery_charge` DECIMAL(10,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(10,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
  `wallet_discount` DECIMAL(10,2) DEFAULT 0.00,
  `loyalty_points_redeemed` INT DEFAULT 0,
  `loyalty_points_earned` INT DEFAULT 0,
  `happy_hour_discount` DECIMAL(10,2) DEFAULT 0.00,
  `flash_deal_discount` DECIMAL(10,2) DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `coupon_code` VARCHAR(50),
  `payment_method` VARCHAR(50) DEFAULT 'cod',
  `payment_status` ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  `transaction_id` VARCHAR(255),
  `order_status` ENUM('pending','confirmed','preparing','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
  `delivery_boy_name` VARCHAR(255),
  `delivery_boy_phone` VARCHAR(20),
  `notes` TEXT,
  `placed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` TIMESTAMP NULL,
  `delivered_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_image` VARCHAR(500),
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `happy_hour_discount` DECIMAL(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT,
  `customer_id` INT,
  `payment_method` VARCHAR(50),
  `gateway` VARCHAR(50),
  `transaction_id` VARCHAR(255),
  `amount` DECIMAL(10,2),
  `currency` VARCHAR(10) DEFAULT 'INR',
  `status` VARCHAR(50) DEFAULT 'pending',
  `gateway_response` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(500),
  `image_url` VARCHAR(500) NOT NULL,
  `link_url` VARCHAR(500),
  `cta_text` VARCHAR(100),
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `starts_at` TIMESTAMP NULL,
  `ends_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `order_id` INT,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT,
  `is_approved` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_customer_product` (`customer_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT,
  `group_name` VARCHAR(50) DEFAULT 'general'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `identifier` VARCHAR(255),
  `ip_address` VARCHAR(45),
  `success` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uploads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255),
  `mime_type` VARCHAR(100),
  `file_size` INT,
  `uploaded_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- V3 TABLES — no inline FK constraints
-- ============================================================

CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `type` ENUM('credit','debit') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `source` VARCHAR(50) DEFAULT 'manual',
  `source_id` VARCHAR(100),
  `balance_after` DECIMAL(10,2) DEFAULT 0.00,
  `description` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loyalty_points` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `points` INT NOT NULL,
  `type` ENUM('earn','redeem') NOT NULL,
  `source` VARCHAR(50) DEFAULT 'order',
  `source_id` VARCHAR(100),
  `description` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `referrals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `referrer_customer_id` INT NOT NULL,
  `referred_customer_id` INT,
  `referral_code` VARCHAR(20) UNIQUE,
  `reward_given` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `flash_deals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `deal_price` DECIMAL(10,2) NOT NULL,
  `original_price` DECIMAL(10,2) NOT NULL,
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP NOT NULL,
  `max_quantity` INT DEFAULT 0,
  `sold_count` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `happy_hours` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `day_of_week` TINYINT DEFAULT 0,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `discount_percent` DECIMAL(5,2) DEFAULT 0.00,
  `discount_flat` DECIMAL(10,2) DEFAULT 0.00,
  `product_ids` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spin_win_rewards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(255) NOT NULL,
  `reward_type` ENUM('points','wallet','coupon','free_delivery','none') DEFAULT 'none',
  `reward_value` VARCHAR(255),
  `probability_weight` INT DEFAULT 1,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `role` ENUM('chef','delivery','manager','waiter','cashier','other') DEFAULT 'other',
  `salary` DECIMAL(10,2) DEFAULT 0.00,
  `joining_date` DATE,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('present','absent','half_day','leave') DEFAULT 'present',
  `check_in` TIME,
  `check_out` TIME,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `reason` TEXT,
  `status` ENUM('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(255),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `address` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100),
  `unit` VARCHAR(50) DEFAULT 'kg',
  `current_stock` DECIMAL(10,2) DEFAULT 0.00,
  `min_stock_level` DECIMAL(10,2) DEFAULT 0.00,
  `cost_per_unit` DECIMAL(10,2) DEFAULT 0.00,
  `supplier_id` INT,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `type` ENUM('in','out','adjustment','waste') NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit_cost` DECIMAL(10,2),
  `notes` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_type` ENUM('customer','admin') DEFAULT 'customer',
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT,
  `type` VARCHAR(50) DEFAULT 'system',
  `is_read` TINYINT(1) DEFAULT 0,
  `data_json` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_calendar_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `event_date` DATE NOT NULL,
  `event_type` ENUM('holiday','event','promotion','maintenance','other') DEFAULT 'event',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_image` VARCHAR(500),
  `rating` INT DEFAULT 5,
  `comment` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `statistics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(255) NOT NULL,
  `value` VARCHAR(100),
  `suffix` VARCHAR(20),
  `icon` VARCHAR(50),
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FOREIGN KEYS (added after all tables exist)
-- ============================================================

ALTER TABLE `addresses`         ADD CONSTRAINT `fk_addr_customer`    FOREIGN KEY (`customer_id`)           REFERENCES `customers`(`id`) ON DELETE CASCADE;
ALTER TABLE `products`          ADD CONSTRAINT `fk_prod_category`    FOREIGN KEY (`category_id`)            REFERENCES `categories`(`id`) ON DELETE CASCADE;
ALTER TABLE `orders`           ADD CONSTRAINT `fk_order_customer`   FOREIGN KEY (`customer_id`)            REFERENCES `customers`(`id`);
ALTER TABLE `orders`           ADD CONSTRAINT `fk_order_address`    FOREIGN KEY (`address_id`)             REFERENCES `addresses`(`id`) ON DELETE SET NULL;
ALTER TABLE `order_items`      ADD CONSTRAINT `fk_oi_order`          FOREIGN KEY (`order_id`)               REFERENCES `orders`(`id`) ON DELETE CASCADE;
ALTER TABLE `order_items`      ADD CONSTRAINT `fk_oi_product`        FOREIGN KEY (`product_id`)             REFERENCES `products`(`id`);
ALTER TABLE `payments`         ADD CONSTRAINT `fk_pay_order`        FOREIGN KEY (`order_id`)               REFERENCES `orders`(`id`) ON DELETE SET NULL;
ALTER TABLE `payments`         ADD CONSTRAINT `fk_pay_customer`      FOREIGN KEY (`customer_id`)            REFERENCES `customers`(`id`) ON DELETE SET NULL;
ALTER TABLE `reviews`          ADD CONSTRAINT `fk_rev_product`       FOREIGN KEY (`product_id`)              REFERENCES `products`(`id`) ON DELETE CASCADE;
ALTER TABLE `reviews`          ADD CONSTRAINT `fk_rev_customer`      FOREIGN KEY (`customer_id`)             REFERENCES `customers`(`id`) ON DELETE CASCADE;
ALTER TABLE `reviews`          ADD CONSTRAINT `fk_rev_order`         FOREIGN KEY (`order_id`)               REFERENCES `orders`(`id`) ON DELETE SET NULL;
ALTER TABLE `wishlist`         ADD CONSTRAINT `fk_wish_customer`     FOREIGN KEY (`customer_id`)            REFERENCES `customers`(`id`) ON DELETE CASCADE;
ALTER TABLE `wishlist`         ADD CONSTRAINT `fk_wish_product`      FOREIGN KEY (`product_id`)             REFERENCES `products`(`id`) ON DELETE CASCADE;
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `fk_wt_customer`   FOREIGN KEY (`customer_id`)            REFERENCES `customers`(`id`) ON DELETE CASCADE;
ALTER TABLE `loyalty_points`   ADD CONSTRAINT `fk_lp_customer`       FOREIGN KEY (`customer_id`)            REFERENCES `customers`(`id`) ON DELETE CASCADE;
ALTER TABLE `referrals`        ADD CONSTRAINT `fk_ref_referrer`      FOREIGN KEY (`referrer_customer_id`)   REFERENCES `customers`(`id`) ON DELETE CASCADE;
ALTER TABLE `referrals`        ADD CONSTRAINT `fk_ref_referred`      FOREIGN KEY (`referred_customer_id`)   REFERENCES `customers`(`id`) ON DELETE SET NULL;
ALTER TABLE `flash_deals`      ADD CONSTRAINT `fk_fd_product`        FOREIGN KEY (`product_id`)             REFERENCES `products`(`id`) ON DELETE CASCADE;
ALTER TABLE `attendance`       ADD CONSTRAINT `fk_att_employee`      FOREIGN KEY (`employee_id`)            REFERENCES `employees`(`id`) ON DELETE CASCADE;
ALTER TABLE `leave_requests`   ADD CONSTRAINT `fk_lr_employee`       FOREIGN KEY (`employee_id`)            REFERENCES `employees`(`id`) ON DELETE CASCADE;
ALTER TABLE `inventory_items`  ADD CONSTRAINT `fk_inv_supplier`      FOREIGN KEY (`supplier_id`)            REFERENCES `suppliers`(`id`) ON DELETE SET NULL;
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `fk_it_item`    FOREIGN KEY (`item_id`)                REFERENCES `inventory_items`(`id`) ON DELETE CASCADE;

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO `admin_users` (`name`, `email`, `password_hash`, `role`, `is_active`) VALUES
('Super Admin', 'admin@zaika.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Default settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `group_name`) VALUES
('restaurant_name', 'Zaika Lounge', 'general'),
('restaurant_tagline', 'Authentic Flavours, Modern Comfort.', 'general'),
('logo_url', '', 'general'),
('primary_color', '#f59e0b', 'general'),
('contact_email', 'zaikalounge@gmail.com', 'contact'),
('contact_phone', '+91 7678311885', 'contact'),
('whatsapp_number', '917678311885', 'contact'),
('address', '334, Delhi Haridwar Road, Rampur Tiraha, Muzaffarnagar, Uttar Pradesh 251002', 'contact'),
('default_delivery_charge', '40.00', 'delivery'),
('free_delivery_threshold', '499.00', 'delivery'),
('min_order_value', '99.00', 'delivery'),
('tax_percent', '5.00', 'delivery'),
('currency_code', 'INR', 'general'),
('currency_symbol', '₹', 'general'),
('enable_cod', '1', 'payment'),
('enable_upi', '1', 'payment'),
('upi_id', 'zaikalounge@upi', 'payment'),
('upi_payee_name', 'Zaika Lounge', 'payment'),
('enable_razorpay', '0', 'payment'),
('razorpay_key_id', '', 'payment'),
('razorpay_key_secret', '', 'payment'),
('enable_stripe', '0', 'payment'),
('stripe_publishable_key', '', 'payment'),
('stripe_secret_key', '', 'payment'),
('enable_whatsapp_order', '1', 'payment'),
('facebook_url', '', 'social'),
('instagram_url', '', 'social'),
('twitter_url', '', 'social'),
('opening_hours', '11:00 AM - 11:00 PM', 'hours'),
('footer_text', '© 2026 Zaika Lounge. All rights reserved.', 'hours'),
('restaurant_is_closed', '0', 'hours'),
('restaurant_closed_message', 'We are currently closed. Please check back during our opening hours.', 'hours')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- Default categories
INSERT INTO `categories` (`name`, `slug`, `description`, `sort_order`, `is_active`) VALUES
('Starters', 'starters', 'Crispy and flavorful starters to begin your meal', 1, 1),
('Main Course', 'main-course', 'Rich and aromatic main course dishes', 2, 1),
('Biryani', 'biryani', 'Authentic dum biryani cooked with fragrant rice', 3, 1),
('Kebabs', 'kebabs', 'Grilled and tandoori kebabs', 4, 1),
('Breads', 'breads', 'Freshly baked tandoori breads', 5, 1),
('Desserts', 'desserts', 'Sweet endings to your meal', 6, 1),
('Beverages', 'beverages', 'Refreshing drinks and shakes', 7, 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Default spin-win rewards
INSERT INTO `spin_win_rewards` (`label`, `reward_type`, `reward_value`, `probability_weight`, `is_active`) VALUES
('₹50 Wallet Credit', 'wallet', '50', 5, 1),
('100 Loyalty Points', 'points', '100', 15, 1),
('Free Delivery', 'free_delivery', '', 10, 1),
('₹20 Wallet Credit', 'wallet', '20', 10, 1),
('50 Loyalty Points', 'points', '50', 20, 1),
('Better Luck Next Time', 'none', '', 40, 1)
ON DUPLICATE KEY UPDATE `label` = `label`;

-- Sample products
INSERT INTO `products` (`category_id`, `name`, `slug`, `description`, `price`, `image_url`, `is_veg`, `is_featured`, `is_best_seller`, `preparation_time`, `rating`, `sort_order`, `stock_status`, `is_active`) VALUES
(1, 'Paneer Tikka', 'paneer-tikka', 'Marinated cottage cheese grilled in tandoor with spices and herbs', 220.00, 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&w=600', 1, 1, 1, 25, 4.5, 1, 'in_stock', 1),
(1, 'Chicken 65', 'chicken-65', 'Spicy deep-fried chicken with curry leaves and green chilies', 240.00, 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&w=600', 0, 1, 0, 20, 4.4, 2, 'in_stock', 1),
(3, 'Chicken Biryani', 'chicken-biryani', 'Aromatic basmati rice cooked with marinated chicken and exotic spices', 280.00, 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&w=600', 0, 1, 1, 30, 4.7, 3, 'in_stock', 1),
(3, 'Veg Biryani', 'veg-biryani', 'Fragrant basmati rice with mixed vegetables and biryani spices', 220.00, 'https://images.pexels.com/photos/1344627/pexels-photo-1344627.jpeg?auto=compress&w=600', 1, 0, 1, 25, 4.3, 4, 'in_stock', 1),
(4, 'Seekh Kebab', 'seekh-kebab', 'Minced meat skewers grilled with onions and spices', 260.00, 'https://images.pexels.com/photos/2233348/pexels-photo-2233348.jpeg?auto=compress&w=600', 0, 0, 0, 20, 4.2, 5, 'in_stock', 1),
(2, 'Butter Chicken', 'butter-chicken', 'Creamy tomato-based curry with tender chicken pieces', 320.00, 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&w=600', 0, 1, 1, 30, 4.8, 6, 'in_stock', 1),
(2, 'Paneer Butter Masala', 'paneer-butter-masala', 'Cottage cheese in a rich creamy tomato gravy', 280.00, 'https://images.pexels.com/photos/2295268/pexels-photo-2295268.jpeg?auto=compress&w=600', 1, 1, 0, 25, 4.5, 7, 'in_stock', 1),
(5, 'Butter Naan', 'butter-naan', 'Soft tandoor-baked bread brushed with butter', 40.00, 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&w=600', 1, 0, 0, 10, 4.3, 8, 'in_stock', 1),
(6, 'Gulab Jamun', 'gulab-jamun', 'Soft milk dumplings soaked in rose-flavored sugar syrup', 80.00, 'https://images.pexels.com/photos/3734037/pexels-photo-3734037.jpeg?auto=compress&w=600', 1, 0, 0, 15, 4.6, 9, 'in_stock', 1),
(7, 'Mango Lassi', 'mango-lassi', 'Refreshing yogurt drink blended with sweet mango', 90.00, 'https://images.pexels.com/photos/4520258/pexels-photo-4520258.jpeg?auto=compress&w=600', 1, 0, 0, 5, 4.4, 10, 'in_stock', 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Default delivery zone
INSERT INTO `delivery_zones` (`name`, `pincode`, `delivery_charge`, `min_order_value`, `estimated_minutes`, `is_active`) VALUES
('Muzaffarnagar City', '251001', 40.00, 99.00, 30, 1),
('Muzaffarnagar Rural', '251002', 50.00, 199.00, 45, 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Default banner
INSERT INTO `banners` (`title`, `subtitle`, `image_url`, `cta_text`, `link_url`, `sort_order`, `is_active`) VALUES
('Welcome to Zaika Lounge', 'Order your favourite dishes online!', 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&w=1200', 'Order Now', '/menu', 1, 1)
ON DUPLICATE KEY UPDATE `title` = `title`;

SET FOREIGN_KEY_CHECKS = 1;
