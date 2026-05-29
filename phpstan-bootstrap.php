<?php

/**
 * PHPStan bootstrap — loads StreamSync autoloader and defines plugin constants.
 * Never loaded in production; only used by phpstan analyse.
 */

// Load StreamSync classes (this plugin depends on StreamSync being active).
$streamsync_autoloader = __DIR__ . '/../niceeins-streamsync/vendor/autoload.php';
if ( file_exists( $streamsync_autoloader ) ) {
    require_once $streamsync_autoloader;
}

if ( ! defined( 'NICEEINS_TWITCH_EXTENSION_VERSION' ) ) {
    define( 'NICEEINS_TWITCH_EXTENSION_VERSION', '0.0.1' );
}

if ( ! defined( 'NICEEINS_TWITCH_EXTENSION_PATH' ) ) {
    define( 'NICEEINS_TWITCH_EXTENSION_PATH', __DIR__ . '/' );
}

if ( ! defined( 'NICEEINS_TWITCH_EXTENSION_URL' ) ) {
    define( 'NICEEINS_TWITCH_EXTENSION_URL', '' );
}

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', '' );
}
