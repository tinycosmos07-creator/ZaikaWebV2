<?php
/**
 * Environment loader.
 * On Hostinger: copy env.production.example.php to env.local.php and fill in real values.
 * Locally: copy env.example.php to env.local.php.
 * If env.local.php doesn't exist, falls back to constants defined below.
 */

// Try to load local env file if it exists
$envLocal = __DIR__ . '/env.local.php';
if (file_exists($envLocal)) {
    require_once $envLocal;
}

/**
 * Get an environment value.
 * Checks defined constants first, then getenv().
 */
function env(string $key, string $default = ''): string {
    if (defined($key)) {
        return constant($key);
    }
    $val = getenv($key);
    return $val !== false ? $val : $default;
}
