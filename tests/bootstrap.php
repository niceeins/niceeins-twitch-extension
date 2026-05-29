<?php

declare(strict_types=1);

/**
 * PHPUnit bootstrap — defines WordPress stubs and plugin constants for unit tests.
 * No WordPress DB, no external calls, no real secrets.
 */

// Plugin constants — only ABSPATH needs to be pre-defined to prevent early exit.
// The plugin defines the other constants itself; pre-defining them would cause
// PHP "already defined" warnings because the plugin uses plain define() calls.
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', '' );
}

// Minimal WordPress function stubs needed by plugin helpers
if ( ! function_exists( 'plugin_dir_path' ) ) {
    function plugin_dir_path( string $file ): string // @phpstan-ignore-line
    {
        return dirname( $file ) . '/';
    }
}

if ( ! function_exists( 'plugin_dir_url' ) ) {
    function plugin_dir_url( string $file ): string // @phpstan-ignore-line
    {
        return '';
    }
}

if ( ! function_exists( 'get_option' ) ) {
    function get_option( string $option, mixed $default = false ): mixed // @phpstan-ignore-line
    {
        return $default;
    }
}

if ( ! function_exists( 'sanitize_text_field' ) ) {
    function sanitize_text_field( string $value ): string // @phpstan-ignore-line
    {
        return $value;
    }
}

if ( ! function_exists( 'add_action' ) ) {
    function add_action( string $hook, callable $callback, int $priority = 10, int $accepted_args = 1 ): bool // @phpstan-ignore-line
    {
        return true;
    }
}

// Load StreamSync stubs (readonly class definitions without autoloader)
$stub_dir = dirname( __DIR__ ) . '/stubs';
foreach ( [
    'Niceeins/StreamSync/Repository/Streamer.php',
    'Niceeins/StreamSync/Repository/Social.php',
    'Niceeins/StreamSync/Repository/Schedule.php',
] as $stub ) {
    $path = $stub_dir . '/' . $stub;
    if ( file_exists( $path ) ) {
        require_once $path;
    }
}

// Load the plugin functions (guarded by ABSPATH check — already defined above)
require_once dirname( __DIR__ ) . '/niceeins-twitch-extension.php';
