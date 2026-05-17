<?php
/**
 * Plugin Name: NiceEins Twitch Extension
 * Description: Twitch Panel Extension for NiceEins streamer profiles.
 * Version: 0.0.1
 * Author: NiceEins
 */

declare(strict_types=1);

use Niceeins\StreamSync\Repository\Schedule;
use Niceeins\StreamSync\Repository\ScheduleRepository;
use Niceeins\StreamSync\Repository\Social;
use Niceeins\StreamSync\Repository\SocialRepository;
use Niceeins\StreamSync\Repository\Streamer;
use Niceeins\StreamSync\Repository\StreamerRepository;
use Niceeins\StreamSync\Repository\Announcement;
use Niceeins\StreamSync\Repository\AnnouncementRepository;
use Niceeins\StreamSync\Support\TwitchHelper;

if (!defined('ABSPATH')) {
    exit;
}

define('NICEEINS_TWITCH_EXTENSION_VERSION', '0.0.1');
define('NICEEINS_TWITCH_EXTENSION_PATH', plugin_dir_path(__FILE__));
define('NICEEINS_TWITCH_EXTENSION_URL', plugin_dir_url(__FILE__));

add_action('rest_api_init', function (): void {
    register_rest_route('niceeins-extension/v1', '/panel', [
        'methods' => WP_REST_Server::READABLE,
        'callback' => 'niceeins_extension_get_panel_data',
        'permission_callback' => '__return_true',
        'args' => [
            'channel_id' => ['sanitize_callback' => 'sanitize_text_field'],
            'channel' => ['sanitize_callback' => 'sanitize_text_field'],
            'user_id' => ['sanitize_callback' => 'absint'],
            'limit' => ['sanitize_callback' => 'absint'],
        ],
    ]);
});

function niceeins_extension_get_panel_data(WP_REST_Request $request): WP_REST_Response
{
    $auth = niceeins_extension_auth_context($request);
    if ($auth['status'] === 'invalid') {
        return niceeins_extension_cors_response(new WP_REST_Response([
            'code' => 'invalid_twitch_token',
            'message' => 'The Twitch authorization token could not be verified.',
            'meta' => [
                'generated_at' => gmdate('c'),
                'auth' => niceeins_extension_auth_meta($auth),
                'cache' => ['hit' => false, 'ttl' => 0],
            ],
        ], 401));
    }

    if (!class_exists(StreamerRepository::class) || !class_exists(ScheduleRepository::class)) {
        return niceeins_extension_cors_response(new WP_REST_Response([
            'code' => 'streamsync_unavailable',
            'message' => 'niceeins-streamsync is required for this endpoint.',
        ], 503));
    }

    $resolved = niceeins_extension_resolve_streamer($request, $auth);
    if ($resolved['streamer'] === null) {
        return niceeins_extension_cors_response(new WP_REST_Response([
            'code' => 'streamer_not_found',
            'message' => 'No streamer was found for the supplied Twitch channel context.',
            'meta' => [
                'resolved_by' => $resolved['resolved_by'],
                'generated_at' => gmdate('c'),
                'auth' => niceeins_extension_auth_meta($auth),
                'cache' => ['hit' => false, 'ttl' => 0],
            ],
        ], 404));
    }

    /** @var Streamer $streamer */
    $streamer = $resolved['streamer'];
    if ($streamer->status !== 'active') {
        return niceeins_extension_cors_response(new WP_REST_Response([
            'code' => 'streamer_inactive',
            'message' => 'This streamer is not active.',
            'meta' => [
                'resolved_by' => $resolved['resolved_by'],
                'generated_at' => gmdate('c'),
                'auth' => niceeins_extension_auth_meta($auth),
                'cache' => ['hit' => false, 'ttl' => 0],
            ],
        ], 403));
    }

    $limit = max(1, min((int) ($request->get_param('limit') ?: 5), 10));
    $cache_key = 'niceeins_extension_panel_' . md5($streamer->user_id . ':' . $limit);
    $cached = get_transient($cache_key);

    if (is_array($cached)) {
        if (!array_key_exists('announcements', $cached)) {
            $cached['announcements'] = [];
        }
        if (!isset($cached['meta']) || !is_array($cached['meta'])) {
            $cached['meta'] = [];
        }
        if (!array_key_exists('announcements_available', $cached['meta'])) {
            $cached['meta']['announcements_available'] = false;
        }
        $cached['meta']['resolved_by'] = $resolved['resolved_by'];
        $cached['meta']['auth'] = niceeins_extension_auth_meta($auth);
        $cached['meta']['cache'] = ['hit' => true, 'ttl' => 60];

        return niceeins_extension_cors_response(new WP_REST_Response($cached, 200));
    }

    $schedules = $streamer->schedule_public
        ? (new ScheduleRepository())->findPublicUpcoming($streamer->user_id, $limit)
        : [];
    $announcements = niceeins_extension_announcements_for_streamer($streamer);

    $data = [
        'streamer' => niceeins_extension_streamer_to_array($streamer),
        'next_stream' => $schedules !== [] ? niceeins_extension_schedule_to_array($schedules[0], $streamer) : null,
        'upcoming_streams' => array_map(
            static fn(Schedule $schedule): array => niceeins_extension_schedule_to_array($schedule, $streamer),
            $schedules
        ),
        'announcements' => $announcements['items'],
        'links' => niceeins_extension_links_for_streamer($streamer),
        'live' => [
            'is_live' => $streamer->is_live,
            'title' => $streamer->live_title,
            'game' => $streamer->live_game,
            'since' => $streamer->live_since !== null ? mysql_to_rfc3339($streamer->live_since) : null,
            'checked_at' => $streamer->live_checked_at !== null ? mysql_to_rfc3339($streamer->live_checked_at) : null,
        ],
        'meta' => [
            'resolved_by' => $resolved['resolved_by'],
            'generated_at' => gmdate('c'),
            'schedule_public' => $streamer->schedule_public,
            'announcements_available' => $announcements['available'],
            'auth' => niceeins_extension_auth_meta($auth),
            'cache' => ['hit' => false, 'ttl' => 60],
        ],
    ];

    set_transient($cache_key, $data, 60);

    return niceeins_extension_cors_response(new WP_REST_Response($data, 200));
}

/**
 * @return array{streamer: Streamer|null, resolved_by: string}
 */
function niceeins_extension_resolve_streamer(WP_REST_Request $request, array $auth): array
{
    $repo = new StreamerRepository();

    if (isset($auth['channel_id']) && is_string($auth['channel_id']) && $auth['channel_id'] !== '') {
        return [
            'streamer' => $repo->findByTwitchId($auth['channel_id']),
            'resolved_by' => 'twitch_jwt',
        ];
    }

    $channel_id = trim((string) ($request->get_param('channel_id') ?: ''));
    if ($channel_id !== '') {
        return [
            'streamer' => $repo->findByTwitchId($channel_id),
            'resolved_by' => 'channel_id',
        ];
    }

    $channel = trim((string) ($request->get_param('channel') ?: ''));
    if ($channel !== '') {
        return [
            'streamer' => $repo->findByTwitchLogin(ltrim($channel, '@')),
            'resolved_by' => 'channel',
        ];
    }

    $user_id = absint($request->get_param('user_id'));
    if ($user_id > 0) {
        return [
            'streamer' => $repo->find($user_id),
            'resolved_by' => 'user_id',
        ];
    }

    return [
        'streamer' => null,
        'resolved_by' => 'none',
    ];
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_streamer_to_array(Streamer $streamer): array
{
    return [
        'user_id' => $streamer->user_id,
        'display_name' => $streamer->display_name ?: $streamer->twitch_login,
        'twitch_login' => $streamer->twitch_login,
        'twitch_user_id' => $streamer->twitch_user_id,
        'profile_image_url' => $streamer->profile_image_url,
        'accent_color' => $streamer->accent_color,
        'timezone' => $streamer->timezone,
        'twitch_url' => $streamer->twitch_login !== null
            ? 'https://twitch.tv/' . rawurlencode($streamer->twitch_login)
            : null,
    ];
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_schedule_to_array(Schedule $schedule, Streamer $streamer): array
{
    $starts_utc = $schedule->starts_at->setTimezone(new DateTimeZone('UTC'));
    $ends_utc = $schedule->ends_at->setTimezone(new DateTimeZone('UTC'));
    $timezone = new DateTimeZone($streamer->timezone ?: 'UTC');

    return [
        'id' => $schedule->id,
        'title' => $schedule->title,
        'starts_at' => $starts_utc->format('c'),
        'ends_at' => $ends_utc->format('c'),
        'starts_at_local' => $schedule->starts_at->setTimezone($timezone)->format('c'),
        'ends_at_local' => $schedule->ends_at->setTimezone($timezone)->format('c'),
        'duration_minutes' => (int) (($ends_utc->getTimestamp() - $starts_utc->getTimestamp()) / 60),
        'category' => [
            'id' => $schedule->twitch_category_id,
            'name' => $schedule->twitch_category_name,
            'box_art_url' => class_exists(TwitchHelper::class)
                ? TwitchHelper::boxArtUrl($schedule->twitch_category_image ?? $schedule->twitch_category_id)
                : null,
        ],
        'is_recurring' => $schedule->recurrence_rule === 'weekly',
    ];
}

/**
 * @return array{items: list<array<string, mixed>>, available: bool}
 */
function niceeins_extension_announcements_for_streamer(Streamer $streamer): array
{
    if (
        !class_exists(AnnouncementRepository::class)
        || !class_exists(Announcement::class)
        || !method_exists(AnnouncementRepository::class, 'findActive')
    ) {
        return [
            'items' => [],
            'available' => false,
        ];
    }

    try {
        $announcements = (new AnnouncementRepository())->findActive(
            $streamer->user_id,
            new DateTimeImmutable('now', new DateTimeZone('UTC'))
        );
    } catch (Throwable) {
        return [
            'items' => [],
            'available' => false,
        ];
    }

    $items = [];
    foreach ($announcements as $announcement) {
        if (!$announcement instanceof Announcement || !$announcement->show_in_panel) {
            continue;
        }

        $items[] = niceeins_extension_announcement_to_array($announcement);
    }

    return [
        'items' => $items,
        'available' => true,
    ];
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_announcement_to_array(Announcement $announcement): array
{
    return [
        'id' => $announcement->id,
        'severity' => $announcement->severity,
        'severity_label' => method_exists($announcement, 'severityLabel')
            ? $announcement->severityLabel()
            : niceeins_extension_announcement_severity_label($announcement->severity),
        'severity_color' => '#' . ltrim(
            method_exists($announcement, 'severityColor')
                ? $announcement->severityColor()
                : niceeins_extension_announcement_severity_color($announcement->severity),
            '#'
        ),
        'title' => $announcement->title,
        'body' => $announcement->body,
        'body_html' => $announcement->body_html,
        'is_pinned' => $announcement->is_pinned,
        'starts_at' => niceeins_extension_datetime_to_utc_iso($announcement->starts_at),
        'ends_at' => niceeins_extension_datetime_to_utc_iso($announcement->ends_at),
        'updated_at' => niceeins_extension_datetime_to_utc_iso($announcement->updated_at),
    ];
}

function niceeins_extension_announcement_severity_label(string $severity): string
{
    return match ($severity) {
        'urgent' => 'Wichtig',
        'notice' => 'Hinweis',
        default => 'Info',
    };
}

function niceeins_extension_announcement_severity_color(string $severity): string
{
    return match ($severity) {
        'urgent' => 'ef4444',
        'notice' => 'f59e0b',
        default => '3b82f6',
    };
}

function niceeins_extension_datetime_to_utc_iso(DateTimeInterface|string|null $value): ?string
{
    if ($value instanceof DateTimeInterface) {
        return DateTimeImmutable::createFromInterface($value)
            ->setTimezone(new DateTimeZone('UTC'))
            ->format('Y-m-d\TH:i:s\Z');
    }

    if (!is_string($value) || trim($value) === '') {
        return null;
    }

    try {
        return (new DateTimeImmutable($value, new DateTimeZone('UTC')))
            ->setTimezone(new DateTimeZone('UTC'))
            ->format('Y-m-d\TH:i:s\Z');
    } catch (Throwable) {
        return null;
    }
}

/**
 * @return list<array<string, mixed>>
 */
function niceeins_extension_links_for_streamer(Streamer $streamer): array
{
    $links = [];

    if (class_exists(SocialRepository::class)) {
        foreach ((new SocialRepository())->findByUser($streamer->user_id) as $social) {
            if (!$social instanceof Social || !$social->is_visible || $social->url === '') {
                continue;
            }

            $links[] = [
                'id' => $social->id,
                'network' => $social->network,
                'label' => $social->label ?: niceeins_extension_label_for_network($social->network),
                'url' => $social->url,
                'sort_order' => $social->sort_order,
            ];
        }
    }

    if ($streamer->discord_invite !== null && !niceeins_extension_has_link($links, $streamer->discord_invite)) {
        $links[] = [
            'id' => null,
            'network' => 'discord',
            'label' => 'Discord',
            'url' => $streamer->discord_invite,
            'sort_order' => 900,
        ];
    }

    if ($streamer->twitch_login !== null) {
        $twitch_url = 'https://twitch.tv/' . rawurlencode($streamer->twitch_login);
        if (!niceeins_extension_has_link($links, $twitch_url)) {
            $links[] = [
                'id' => null,
                'network' => 'twitch',
                'label' => 'Twitch',
                'url' => $twitch_url,
                'sort_order' => 1000,
            ];
        }
    }

    usort(
        $links,
        static fn(array $a, array $b): int => ((int) $a['sort_order']) <=> ((int) $b['sort_order'])
    );

    return array_values($links);
}

/**
 * @param list<array<string, mixed>> $links
 */
function niceeins_extension_has_link(array $links, string $url): bool
{
    foreach ($links as $link) {
        if (isset($link['url']) && rtrim((string) $link['url'], '/') === rtrim($url, '/')) {
            return true;
        }
    }

    return false;
}

function niceeins_extension_label_for_network(string $network): string
{
    return match ($network) {
        'youtube' => 'YouTube',
        'x' => 'X',
        'tiktok' => 'TikTok',
        'instagram' => 'Instagram',
        'bluesky' => 'Bluesky',
        'steam' => 'Steam',
        'github' => 'GitHub',
        'website' => 'Website',
        'twitch' => 'Twitch',
        'discord' => 'Discord',
        default => 'Link',
    };
}

/**
 * @return array{status: string, channel_id?: string, user_id?: string, role?: string, reason?: string}
 */
function niceeins_extension_auth_context(WP_REST_Request $request): array
{
    $token = niceeins_extension_bearer_token($request);
    if ($token === '') {
        return ['status' => 'missing'];
    }

    $secret = niceeins_extension_secret();
    if ($secret === '') {
        return ['status' => 'unconfigured'];
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return ['status' => 'invalid', 'reason' => 'malformed'];
    }

    $header = niceeins_extension_json_part($parts[0]);
    $payload = niceeins_extension_json_part($parts[1]);
    if (!is_array($header) || !is_array($payload) || ($header['alg'] ?? '') !== 'HS256') {
        return ['status' => 'invalid', 'reason' => 'unsupported_token'];
    }

    $expected = niceeins_extension_base64url_encode(
        hash_hmac('sha256', $parts[0] . '.' . $parts[1], $secret, true)
    );
    if (!hash_equals($expected, $parts[2])) {
        return ['status' => 'invalid', 'reason' => 'signature'];
    }

    if (isset($payload['exp']) && (int) $payload['exp'] < time()) {
        return ['status' => 'invalid', 'reason' => 'expired'];
    }

    return array_filter([
        'status' => 'verified',
        'channel_id' => isset($payload['channel_id']) ? (string) $payload['channel_id'] : null,
        'user_id' => isset($payload['user_id']) ? (string) $payload['user_id'] : null,
        'role' => isset($payload['role']) ? (string) $payload['role'] : null,
    ], static fn($value): bool => $value !== null && $value !== '');
}

function niceeins_extension_bearer_token(WP_REST_Request $request): string
{
    $header = (string) $request->get_header('authorization');
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches) !== 1) {
        return '';
    }

    return trim($matches[1]);
}

function niceeins_extension_secret(): string
{
    $configured = defined('NICEEINS_TWITCH_EXTENSION_SECRET')
        ? (string) constant('NICEEINS_TWITCH_EXTENSION_SECRET')
        : (string) get_option('niceeins_twitch_extension_secret', '');
    $configured = trim($configured);
    if ($configured === '') {
        $configured = trim((string) getenv('NICEEINS_TWITCH_EXTENSION_SECRET'));
    }

    $decoded = base64_decode($configured, true);

    return $decoded !== false ? $decoded : $configured;
}

/**
 * @return array<string, mixed>|null
 */
function niceeins_extension_json_part(string $part): ?array
{
    $json = niceeins_extension_base64url_decode($part);
    if ($json === false) {
        return null;
    }

    $decoded = json_decode($json, true);

    return is_array($decoded) ? $decoded : null;
}

/**
 * @return string|false
 */
function niceeins_extension_base64url_decode(string $value)
{
    $remainder = strlen($value) % 4;
    if ($remainder > 0) {
        $value .= str_repeat('=', 4 - $remainder);
    }

    return base64_decode(strtr($value, '-_', '+/'), true);
}

function niceeins_extension_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

/**
 * @param array<string, mixed> $auth
 *
 * @return array<string, mixed>
 */
function niceeins_extension_auth_meta(array $auth): array
{
    return array_filter([
        'status' => $auth['status'] ?? 'missing',
        'resolved_channel' => $auth['channel_id'] ?? null,
        'role' => $auth['role'] ?? null,
        'reason' => $auth['reason'] ?? null,
    ], static fn($value): bool => $value !== null && $value !== '');
}

function niceeins_extension_cors_response(WP_REST_Response $response): WP_REST_Response
{
    $response->header('Access-Control-Allow-Origin', '*');
    $response->header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    $response->header('Vary', 'Authorization');
    $response->header('Cache-Control', 'max-age=60, public');

    return $response;
}
