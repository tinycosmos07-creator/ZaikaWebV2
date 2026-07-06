# Zaika Lounge - Hostinger Deployment Guide

## What You Have

This is a full-stack restaurant ordering system with:
- **Frontend**: React SPA (built to `public_html/`)
- **Backend**: PHP REST API (`api/`)
- **Database**: MySQL (Hostinger-compatible)

---

## Step-by-Step Deployment

### STEP 1: Set Up Your Database on Hostinger

1. Log into **Hostinger hPanel** → **Databases** → **MySQL Databases**
2. Create a new database (e.g., `u123456789_zaika`)
3. Create a new database user (e.g., `u123456789_zaika_user`) with a strong password
4. Assign the user to the database with **All Privileges**
5. Note down: Database name, User, Password (Host is always `localhost`)

---

### STEP 2: Import the Database Schema

1. Go to **phpMyAdmin** in hPanel
2. Select your newly created database
3. Click **Import** tab
4. Upload the file: `database_schema.sql`
5. Click **Go**

This creates all tables and seeds default data including:
- Admin user: `admin@zaika.com` / password: `admin123` **(change immediately!)**
- Sample categories and products
- Default settings

---

### STEP 3: Create the Environment Config

1. On your server, inside the `api/config/` folder, create a new file: `env.local.php`
2. Copy the contents of `api/config/env.production.example.php` into it
3. Fill in your real values:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_zaika');       // Your database name
define('DB_USER', 'u123456789_zaika_user');  // Your database user
define('DB_PASS', 'your_strong_password');   // Your database password
define('JWT_SECRET', 'generate_a_32_char_random_string_here_abc123xyz');
define('APP_DEBUG', '0');
```

**Generate a JWT secret**: Go to https://randomkeygen.com/ and use a 256-bit WEP key

---

### STEP 4: Upload Files to Hostinger

Using **File Manager** or **FTP (FileZilla)**:

#### Option A: Root Domain Deployment (yourdomain.com)

Upload to: `public_html/`

```
your-root/
├── public_html/          → Upload content of public_html/ here (index.html, assets/, favicon.svg, .htaccess)
├── api/                  → Upload entire api/ folder here
├── uploads/              → Create this empty folder with permission 755
```

So the file structure on Hostinger should be:
```
public_html/
├── index.html
├── .htaccess
├── favicon.svg
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
├── api/
│   ├── bootstrap.php
│   ├── config/
│   ├── includes/
│   └── v1/
└── uploads/              (create empty, chmod 755)
```

#### Option B: Subdirectory Deployment (yourdomain.com/restaurant)

1. Create folder `restaurant` inside `public_html/`
2. Upload `public_html/` contents into `public_html/restaurant/`
3. Upload `api/` folder into `public_html/restaurant/api/`
4. Create `public_html/restaurant/uploads/` folder

---

### STEP 5: Set File Permissions

In File Manager, set these permissions:
- `uploads/` folder → **755**
- `api/config/env.local.php` → **600**
- All `.php` files → **644**
- All folders → **755**

---

### STEP 6: Configure the API URL

The frontend assumes the API is at `/api/v1/` (relative to where index.html is served from). This works automatically when both frontend and API are deployed together.

If you deploy to a different domain (e.g., API at api.yourdomain.com), update `api/includes/http.php` line 9:
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

---

### STEP 7: Test the Deployment

1. Visit `https://yourdomain.com` — should show the restaurant homepage
2. Visit `https://yourdomain.com/admin/login` — should show admin login
3. Login with `admin@zaika.com` / `admin123`
4. **Immediately change the admin password** in Admin → Settings

---

### STEP 8: Configure Your Restaurant Details

1. Go to Admin Panel → Settings
2. Update:
   - Restaurant name, tagline, logo
   - Contact info and WhatsApp number
   - Delivery charges and minimum order value
   - Tax percentage
   - Opening hours
   - Payment methods (enable UPI/Razorpay as needed)

---

### STEP 9: Add Your Content

1. **Categories**: Admin → Categories → Add your food categories
2. **Products**: Admin → Products → Add your menu items with images
3. **Banners**: Admin → Banners → Add homepage banners
4. **Delivery Areas**: Admin → Delivery Areas → Add your serviceable pincodes

---

## File Structure Reference

```
project/
├── public_html/          ← Built React SPA (deploy this to Hostinger public_html)
│   ├── index.html
│   ├── .htaccess         ← SPA routing (already created)
│   ├── favicon.svg
│   └── assets/
├── api/                  ← PHP Backend (deploy alongside public_html)
│   ├── bootstrap.php
│   ├── .htaccess         ← API protection (already created)
│   ├── config/
│   │   ├── env.php       ← Environment loader
│   │   ├── env.local.php ← Your secrets (CREATE THIS, never commit)
│   │   ├── env.example.php
│   │   ├── env.production.example.php
│   │   └── database.php
│   ├── includes/
│   │   ├── auth.php
│   │   ├── helpers.php
│   │   ├── http.php
│   │   ├── jwt.php
│   │   └── rate_limit.php
│   └── v1/
│       ├── auth.php
│       ├── products.php
│       ├── categories.php
│       ├── orders.php
│       └── ... (all API endpoints)
├── uploads/              ← Uploaded images (create empty on server)
├── database_schema.sql   ← Import this into MySQL via phpMyAdmin
└── src/                  ← React source (don't deploy this)
```

---

## Admin Default Credentials

| Field | Value |
|-------|-------|
| URL | https://yourdomain.com/admin/login |
| Email | admin@zaika.com |
| Password | admin123 |

**CHANGE THE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

---

## Rebuilding After Code Changes

If you make any changes to the React source code (`src/`), rebuild:

```bash
npm run build
```

Then re-upload the `public_html/` folder to Hostinger.

---

## Common Issues & Fixes

### 404 on page refresh (e.g., /menu, /admin)
→ Ensure `public_html/.htaccess` is uploaded with SPA routing rules.

### API returns 500 or "Database connection failed"
→ Check `api/config/env.local.php` has correct DB credentials.

### Images not uploading
→ Ensure `uploads/` folder exists and has 755 permissions.

### Admin login returns 500
→ JWT_SECRET not set in `env.local.php`. Add it.

### CORS errors in browser console
→ Ensure the `.htaccess` in `api/` is uploaded. Check `api/includes/http.php`.
