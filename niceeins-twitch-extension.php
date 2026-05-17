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
    if (!class_exists(StreamerRepository::class) || !class_exists(ScheduleRepository::class)) {
        return niceeins_extension_cors_response(new WP_REST_Response([
            'code' => 'streamsync_unavailable',
            'message' => 'niceeins-streamsync is required for this endpoint.',
        ], 503));
    }

    $resolved = niceeins_extension_resolve_streamer($request);
    if ($resolved['streamer'] === null) {
        return niceeins_extension_cors_response(new WP_REST_Response([
            'code' => 'streamer_not_found',
            'message' => 'No streamer was found for the supplied Twitch channel context.',
            'meta' => [
                'resolved_by' => $resolved['resolved_by'],
                'generated_at' => gmdate('c'),
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
                'cache' => ['hit' => false, 'ttl' => 0],
            ],
        ], 403));
    }

    $limit = max(1, min((int) ($request->get_param('limit') ?: 5), 10));
    $cache_key = 'niceeins_extension_panel_' . md5($streamer->user_id . ':' . $limit);
    $cached = get_transient($cache_key);

    if (is_array($cached)) {
        $cached['meta']['resolved_by'] = $resolved['resolved_by'];
        $cached['meta']['cache'] = ['hit' => true, 'ttl' => 60];

        return niceeins_extension_cors_response(new WP_REST_Response($cached, 200));
    }

    $schedules = $streamer->schedule_public
        ? (new ScheduleRepository())->findPublicUpcoming($streamer->user_id, $limit)
        : [];

    $data = [
        'streamer' => niceeins_extension_streamer_to_array($streamer),
        'next_stream' => $schedules !== [] ? niceeins_extension_schedule_to_array($schedules[0], $streamer) : null,
        'upcoming_streams' => array_map(
            static fn(Schedule $schedule): array => niceeins_extension_schedule_to_array($schedule, $streamer),
            $schedules
        ),
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
            'cache' => ['hit' => false, 'ttl' => 60],
        ],
    ];

    set_transient($cache_key, $data, 60);

    return niceeins_extension_cors_response(new WP_REST_Response($data, 200));
}

/**
 * @return array{streamer: Streamer|null, resolved_by: string}
 */
function niceeins_extension_resolve_streamer(WP_REST_Request $request): array
{
    $repo = new StreamerRepository();

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

function niceeins_extension_cors_response(WP_REST_Response $response): WP_REST_Response
{
    $response->header('Access-Control-Allow-Origin', '*');
    $response->header('Cache-Control', 'max-age=60, public');

    return $response;
}
