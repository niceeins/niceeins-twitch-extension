<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Smoke tests for pure helper functions in niceeins-twitch-extension.php.
 * No WordPress DB, no external calls, no real secrets.
 */
final class HelperFunctionsTest extends TestCase
{
    // ── niceeins_extension_base64url_encode / _decode ──────────────────────

    public function test_base64url_roundtrip(): void
    {
        $original = 'Hello, Twitch! 🎮';
        $encoded  = niceeins_extension_base64url_encode( $original );
        $decoded  = niceeins_extension_base64url_decode( $encoded );

        self::assertSame( $original, $decoded );
        self::assertStringNotContainsString( '+', $encoded );
        self::assertStringNotContainsString( '/', $encoded );
        self::assertStringNotContainsString( '=', $encoded );
    }

    public function test_base64url_decode_invalid_returns_false(): void
    {
        $result = niceeins_extension_base64url_decode( '!!!invalid!!!' );
        self::assertFalse( $result );
    }

    // ── niceeins_extension_datetime_to_utc_iso ─────────────────────────────

    public function test_datetime_to_utc_iso_from_datetime_interface(): void
    {
        $dt     = new DateTimeImmutable( '2024-06-15 12:00:00', new DateTimeZone( 'Europe/Berlin' ) );
        $result = niceeins_extension_datetime_to_utc_iso( $dt );
        self::assertSame( '2024-06-15T10:00:00Z', $result );
    }

    public function test_datetime_to_utc_iso_from_string(): void
    {
        $result = niceeins_extension_datetime_to_utc_iso( '2024-01-01 00:00:00' );
        self::assertSame( '2024-01-01T00:00:00Z', $result );
    }

    public function test_datetime_to_utc_iso_null_returns_null(): void
    {
        self::assertNull( niceeins_extension_datetime_to_utc_iso( null ) );
    }

    public function test_datetime_to_utc_iso_empty_string_returns_null(): void
    {
        self::assertNull( niceeins_extension_datetime_to_utc_iso( '   ' ) );
    }

    public function test_datetime_to_utc_iso_invalid_string_returns_null(): void
    {
        self::assertNull( niceeins_extension_datetime_to_utc_iso( 'not-a-date' ) );
    }

    // ── niceeins_extension_label_for_network ───────────────────────────────

    /** @return array<string, array{string, string}> */
    public static function network_label_provider(): array
    {
        return [
            'youtube'   => [ 'youtube',   'YouTube'   ],
            'twitch'    => [ 'twitch',    'Twitch'    ],
            'discord'   => [ 'discord',   'Discord'   ],
            'x'         => [ 'x',         'X'         ],
            'tiktok'    => [ 'tiktok',    'TikTok'    ],
            'instagram' => [ 'instagram', 'Instagram' ],
            'bluesky'   => [ 'bluesky',   'Bluesky'   ],
            'steam'     => [ 'steam',     'Steam'     ],
            'github'    => [ 'github',    'GitHub'    ],
            'website'   => [ 'website',   'Website'   ],
            'unknown'   => [ 'foobar',    'Link'      ],
        ];
    }

    #[DataProvider( 'network_label_provider' )]
    public function test_label_for_network( string $network, string $expected ): void
    {
        self::assertSame( $expected, niceeins_extension_label_for_network( $network ) );
    }

    // ── niceeins_extension_has_link ────────────────────────────────────────

    public function test_has_link_returns_true_for_matching_url(): void
    {
        $links = [
            [ 'url' => 'https://twitch.tv/niceeins' ],
            [ 'url' => 'https://discord.gg/abc' ],
        ];
        self::assertTrue( niceeins_extension_has_link( $links, 'https://twitch.tv/niceeins' ) );
    }

    public function test_has_link_ignores_trailing_slash(): void
    {
        $links = [ [ 'url' => 'https://twitch.tv/niceeins/' ] ];
        self::assertTrue( niceeins_extension_has_link( $links, 'https://twitch.tv/niceeins' ) );
    }

    public function test_has_link_returns_false_for_empty_list(): void
    {
        self::assertFalse( niceeins_extension_has_link( [], 'https://twitch.tv/niceeins' ) );
    }

    public function test_has_link_returns_false_for_different_url(): void
    {
        $links = [ [ 'url' => 'https://twitch.tv/other' ] ];
        self::assertFalse( niceeins_extension_has_link( $links, 'https://twitch.tv/niceeins' ) );
    }
}
