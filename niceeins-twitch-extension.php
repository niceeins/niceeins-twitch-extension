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
use Niceeins\StreamSync\Repository\Command;
use Niceeins\StreamSync\Repository\CommandRepository;
use Niceeins\StreamSync\Repository\PlayedGame;
use Niceeins\StreamSync\Repository\PlayedGameRepository;
use Niceeins\StreamSync\Repository\GameSuggestion;
use Niceeins\StreamSync\Repository\GameSuggestionRepository;
use Niceeins\StreamSync\Support\TwitchHelper;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'NICEEINS_TWITCH_EXTENSION_VERSION', '0.0.1' );
define( 'NICEEINS_TWITCH_EXTENSION_PATH', plugin_dir_path( __FILE__ ) );
define( 'NICEEINS_TWITCH_EXTENSION_URL', plugin_dir_url( __FILE__ ) );

add_action(
    'rest_api_init',
    function (): void {
        register_rest_route(
            'niceeins-extension/v1',
            '/panel',
            [
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'niceeins_extension_get_panel_data',
				'permission_callback' => '__return_true',
				'args'                => [
					'channel_id' => [ 'sanitize_callback' => 'sanitize_text_field' ],
					'channel'    => [ 'sanitize_callback' => 'sanitize_text_field' ],
					'user_id'    => [ 'sanitize_callback' => 'absint' ],
					'limit'      => [ 'sanitize_callback' => 'absint' ],
					'widget'     => [ 'sanitize_callback' => 'sanitize_key' ],
				],
            ]
        );
    }
);

function niceeins_extension_get_panel_data( WP_REST_Request $request ): WP_REST_Response
{
    $auth = niceeins_extension_auth_context( $request );
    if ( $auth['status'] === 'invalid' ) {
        return niceeins_extension_cors_response(
            new WP_REST_Response(
                [
					'code'    => 'invalid_twitch_token',
					'message' => 'The Twitch authorization token could not be verified.',
					'meta'    => [
						'generated_at' => gmdate( 'c' ),
						'auth'         => niceeins_extension_auth_meta( $auth ),
						'cache'        => [
							'hit' => false,
							'ttl' => 0,
						],
                    ],
                ],
                401
            )
        );
    }

    if ( ! class_exists( StreamerRepository::class ) || ! class_exists( ScheduleRepository::class ) ) {
        return niceeins_extension_cors_response(
            new WP_REST_Response(
                [
					'code'    => 'streamsync_unavailable',
					'message' => 'niceeins-streamsync is required for this endpoint.',
                ],
                503
            )
        );
    }

    $resolved = niceeins_extension_resolve_streamer( $request, $auth );
    if ( $resolved['streamer'] === null ) {
        return niceeins_extension_cors_response(
            new WP_REST_Response(
                [
					'code'    => 'streamer_not_found',
					'message' => 'No streamer was found for the supplied Twitch channel context.',
					'meta'    => [
						'resolved_by'  => $resolved['resolved_by'],
						'generated_at' => gmdate( 'c' ),
						'auth'         => niceeins_extension_auth_meta( $auth ),
						'cache'        => [
							'hit' => false,
							'ttl' => 0,
						],
                    ],
                ],
                404
            )
        );
    }

    /** @var Streamer $streamer */
    $streamer = $resolved['streamer'];
    if ( $streamer->status !== 'active' ) {
        return niceeins_extension_cors_response(
            new WP_REST_Response(
                [
					'code'    => 'streamer_inactive',
					'message' => 'This streamer is not active.',
					'meta'    => [
						'resolved_by'  => $resolved['resolved_by'],
						'generated_at' => gmdate( 'c' ),
						'auth'         => niceeins_extension_auth_meta( $auth ),
						'cache'        => [
							'hit' => false,
							'ttl' => 0,
						],
                    ],
                ],
                403
            )
        );
    }

    $limit     = max( 1, min( (int) ( $request->get_param( 'limit' ) ?: 5 ), 10 ) );
    $widget    = niceeins_extension_widget_param( $request );
    $cache_key = 'niceeins_extension_panel_' . md5( $streamer->user_id . ':' . $limit . ':' . $widget );
    $cached    = get_transient( $cache_key );

    if ( is_array( $cached ) ) {
        if ( ! array_key_exists( 'announcements', $cached ) ) {
            $cached['announcements'] = [];
        }
        if ( ! array_key_exists( 'game_suggestions', $cached ) ) {
            $cached['game_suggestions'] = [];
        }
        if ( ! isset( $cached['meta'] ) || ! is_array( $cached['meta'] ) ) {
            $cached['meta'] = [];
        }
        if ( ! array_key_exists( 'announcements_available', $cached['meta'] ) ) {
            $cached['meta']['announcements_available'] = false;
        }
        if ( ! array_key_exists( 'game_suggestions_available', $cached['meta'] ) ) {
            $cached['meta']['game_suggestions_available'] = false;
        }
        $cached['meta']['resolved_by'] = $resolved['resolved_by'];
        $cached['meta']['auth']        = niceeins_extension_auth_meta( $auth );
        $cached['meta']['cache']       = [
			'hit' => true,
			'ttl' => 60,
        ];
        if ( ! niceeins_extension_commands_repository_available() ) {
            unset( $cached['commands'] );
        }
        if ( ! niceeins_extension_games_repository_available() ) {
            unset( $cached['games'] );
            unset( $cached['meta']['games_public_widget'], $cached['meta']['games_available'] );
        }

        return niceeins_extension_cors_response( new WP_REST_Response( $cached, 200 ) );
    }

    $schedules     = $streamer->schedule_public
        ? ( new ScheduleRepository() )->findPublicUpcoming( $streamer->user_id, $limit )
        : [];
    $announcements = niceeins_extension_announcements_for_streamer( $streamer );
    $commands      = niceeins_extension_commands_for_streamer( $streamer );
    $suggestions   = niceeins_extension_game_suggestions_for_streamer( $streamer );
    $games         = in_array( $widget, [ 'all', 'games' ], true )
        ? niceeins_extension_games_for_streamer( $streamer )
        : [
			'items'       => null,
			'available'   => false,
			'widget_mode' => 'off',
		];

    $data = [
        'streamer'         => niceeins_extension_streamer_to_array( $streamer ),
        'next_stream'      => $schedules !== [] ? niceeins_extension_schedule_to_array( $schedules[0], $streamer ) : null,
        'upcoming_streams' => array_map(
            static fn( Schedule $schedule ): array => niceeins_extension_schedule_to_array( $schedule, $streamer ),
            $schedules
        ),
        'announcements'    => $announcements['items'],
        'game_suggestions' => $suggestions['items'],
        'links'            => niceeins_extension_links_for_streamer( $streamer ),
        'live'             => [
            'is_live'    => $streamer->is_live,
            'title'      => $streamer->live_title,
            'game'       => $streamer->live_game,
            'since'      => $streamer->live_since !== null ? mysql_to_rfc3339( $streamer->live_since ) : null,
            'checked_at' => $streamer->live_checked_at !== null ? mysql_to_rfc3339( $streamer->live_checked_at ) : null,
        ],
        'meta'             => [
            'resolved_by'             => $resolved['resolved_by'],
            'generated_at'            => gmdate( 'c' ),
            'schedule_public'         => $streamer->schedule_public,
            'announcements_available' => $announcements['available'],
            'game_suggestions_available' => $suggestions['available'],
            'games_available'         => $games['available'],
            'games_public_widget'     => $games['widget_mode'],
            'auth'                    => niceeins_extension_auth_meta( $auth ),
            'cache'                   => [
				'hit' => false,
				'ttl' => 60,
			],
        ],
    ];

    if ( $commands['available'] ) {
        $data['commands'] = $commands['items'];
    }

    if ( is_array( $games['items'] ) ) {
        $data['games'] = $games['items'];
    }

    set_transient( $cache_key, $data, 60 );

    return niceeins_extension_cors_response( new WP_REST_Response( $data, 200 ) );
}

/**
 * @return array{streamer: Streamer|null, resolved_by: string}
 */
function niceeins_extension_resolve_streamer( WP_REST_Request $request, array $auth ): array
{
    $repo = new StreamerRepository();

    if ( isset( $auth['channel_id'] ) && is_string( $auth['channel_id'] ) && $auth['channel_id'] !== '' ) {
        return [
            'streamer'    => $repo->findByTwitchId( $auth['channel_id'] ),
            'resolved_by' => 'twitch_jwt',
        ];
    }

    $channel_id = trim( (string) ( $request->get_param( 'channel_id' ) ?: '' ) );
    if ( $channel_id !== '' ) {
        return [
            'streamer'    => $repo->findByTwitchId( $channel_id ),
            'resolved_by' => 'channel_id',
        ];
    }

    $channel = trim( (string) ( $request->get_param( 'channel' ) ?: '' ) );
    if ( $channel !== '' ) {
        return [
            'streamer'    => $repo->findByTwitchLogin( ltrim( $channel, '@' ) ),
            'resolved_by' => 'channel',
        ];
    }

    $user_id = absint( $request->get_param( 'user_id' ) );
    if ( $user_id > 0 ) {
        return [
            'streamer'    => $repo->find( $user_id ),
            'resolved_by' => 'user_id',
        ];
    }

    return [
        'streamer'    => null,
        'resolved_by' => 'none',
    ];
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_streamer_to_array( Streamer $streamer ): array
{
    return [
        'user_id'           => $streamer->user_id,
        'display_name'      => $streamer->display_name ?: $streamer->twitch_login,
        'twitch_login'      => $streamer->twitch_login,
        'twitch_user_id'    => $streamer->twitch_user_id,
        'profile_image_url' => $streamer->profile_image_url,
        'accent_color'      => $streamer->accent_color,
        'timezone'          => $streamer->timezone,
        'twitch_url'        => $streamer->twitch_login !== null
            ? 'https://twitch.tv/' . rawurlencode( $streamer->twitch_login )
            : null,
        'suggestions_url'   => niceeins_extension_suggestions_profile_url( $streamer ),
    ];
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_schedule_to_array( Schedule $schedule, Streamer $streamer ): array
{
    $starts_utc = $schedule->starts_at->setTimezone( new DateTimeZone( 'UTC' ) );
    $ends_utc   = $schedule->ends_at->setTimezone( new DateTimeZone( 'UTC' ) );
    $timezone   = new DateTimeZone( $streamer->timezone ?: 'UTC' );

    return [
        'id'               => $schedule->id,
        'title'            => $schedule->title,
        'starts_at'        => $starts_utc->format( 'c' ),
        'ends_at'          => $ends_utc->format( 'c' ),
        'starts_at_local'  => $schedule->starts_at->setTimezone( $timezone )->format( 'c' ),
        'ends_at_local'    => $schedule->ends_at->setTimezone( $timezone )->format( 'c' ),
        'duration_minutes' => (int) ( ( $ends_utc->getTimestamp() - $starts_utc->getTimestamp() ) / 60 ),
        'category'         => [
            'id'          => $schedule->twitch_category_id,
            'name'        => $schedule->twitch_category_name,
            'box_art_url' => class_exists( TwitchHelper::class )
                ? TwitchHelper::boxArtUrl( $schedule->twitch_category_image ?? $schedule->twitch_category_id )
                : null,
        ],
        'is_recurring'     => $schedule->recurrence_rule === 'weekly',
    ];
}

/**
 * @return array{items: list<array<string, mixed>>, available: bool}
 */
function niceeins_extension_announcements_for_streamer( Streamer $streamer ): array
{
    if (
        ! class_exists( AnnouncementRepository::class )
        || ! class_exists( Announcement::class )
        || ! method_exists( AnnouncementRepository::class, 'findActive' )
    ) {
        return [
            'items'     => [],
            'available' => false,
        ];
    }

    try {
        $announcements = ( new AnnouncementRepository() )->findActive(
            $streamer->user_id,
            new DateTimeImmutable( 'now', new DateTimeZone( 'UTC' ) )
        );
    } catch ( Throwable ) {
        return [
            'items'     => [],
            'available' => false,
        ];
    }

    $items = [];
    foreach ( $announcements as $announcement ) {
        if ( ! $announcement instanceof Announcement || ! $announcement->show_in_panel ) {
            continue;
        }

        $items[] = niceeins_extension_announcement_to_array( $announcement );
    }

    return [
        'items'     => $items,
        'available' => true,
    ];
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_announcement_to_array( Announcement $announcement ): array
{
    return [
        'id'             => $announcement->id,
        'severity'       => $announcement->severity,
        'severity_label' => method_exists( $announcement, 'severityLabel' )
            ? $announcement->severityLabel()
            : niceeins_extension_announcement_severity_label( $announcement->severity ),
        'severity_color' => '#' . ltrim(
            method_exists( $announcement, 'severityColor' )
                ? $announcement->severityColor()
                : niceeins_extension_announcement_severity_color( $announcement->severity ),
            '#'
        ),
        'title'          => $announcement->title,
        'body'           => $announcement->body,
        'body_html'      => $announcement->body_html,
        'is_pinned'      => $announcement->is_pinned,
        'starts_at'      => niceeins_extension_datetime_to_utc_iso( $announcement->starts_at ),
        'ends_at'        => niceeins_extension_datetime_to_utc_iso( $announcement->ends_at ),
        'updated_at'     => niceeins_extension_datetime_to_utc_iso( $announcement->updated_at ),
    ];
}

function niceeins_extension_announcement_severity_label( string $severity ): string
{
    return match ( $severity ) {
        'urgent' => 'Wichtig',
        'notice' => 'Hinweis',
        default => 'Info',
    };
}

function niceeins_extension_announcement_severity_color( string $severity ): string
{
    return match ( $severity ) {
        'urgent' => 'ef4444',
        'notice' => 'f59e0b',
        default => '3b82f6',
    };
}

function niceeins_extension_game_suggestions_repository_available(): bool
{
    return class_exists( GameSuggestionRepository::class )
        && class_exists( GameSuggestion::class )
        && method_exists( GameSuggestionRepository::class, 'findPublicForUser' );
}

/**
 * @return array{items: list<array<string, mixed>>, available: bool}
 */
function niceeins_extension_game_suggestions_for_streamer( Streamer $streamer ): array
{
    if ( ! niceeins_extension_game_suggestions_repository_available() ) {
        return [
            'items'     => [],
            'available' => false,
        ];
    }

    try {
        $suggestions = ( new GameSuggestionRepository() )->findPublicForUser( $streamer->user_id, 5 );
    } catch ( Throwable ) {
        return [
            'items'     => [],
            'available' => false,
        ];
    }

    $items = [];
    foreach ( $suggestions as $suggestion ) {
        if ( ! $suggestion instanceof GameSuggestion ) {
            continue;
        }

        $items[] = niceeins_extension_game_suggestion_to_array( $suggestion );
    }

    return [
        'items'     => $items,
        'available' => true,
    ];
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_game_suggestion_to_array( GameSuggestion $suggestion ): array
{
    return [
        'game_name'    => $suggestion->game_name,
        'votes'        => $suggestion->votes,
        'status'       => $suggestion->status,
        'status_label' => method_exists( $suggestion, 'statusLabel' )
            ? $suggestion->statusLabel()
            : $suggestion->status,
        'status_color' => method_exists( $suggestion, 'statusColor' )
            ? $suggestion->statusColor()
            : '#6b7280',
    ];
}

function niceeins_extension_suggestions_profile_url( Streamer $streamer ): ?string
{
    if ( $streamer->twitch_login === null || $streamer->twitch_login === '' ) {
        return null;
    }

    $login = strtolower( (string) $streamer->twitch_login );

    return 'https://' . rawurlencode( $login ) . '.nice1.id/#suggestions';
}

/**
 * @return array{items: list<array<string, mixed>>, available: bool}
 */
function niceeins_extension_commands_for_streamer( Streamer $streamer ): array
{
    if ( ! niceeins_extension_commands_repository_available() ) {
        return [
            'items'     => [],
            'available' => false,
        ];
    }

    try {
        $commands = ( new CommandRepository() )->findByUser( $streamer->user_id, true );
    } catch ( Throwable ) {
        return [
            'items'     => [],
            'available' => false,
        ];
    }

    $items = [];
    foreach ( $commands as $command ) {
        if ( ! $command instanceof Command ) {
            continue;
        }

        $items[] = niceeins_extension_command_to_array( $command );
    }

    return [
        'items'     => $items,
        'available' => true,
    ];
}

function niceeins_extension_commands_repository_available(): bool
{
    return class_exists( CommandRepository::class )
        && class_exists( Command::class )
        && method_exists( CommandRepository::class, 'findByUser' );
}

function niceeins_extension_games_repository_available(): bool
{
    return class_exists( PlayedGameRepository::class )
        && class_exists( PlayedGame::class )
        && method_exists( PlayedGameRepository::class, 'findPublicForUser' );
}

function niceeins_extension_widget_param( WP_REST_Request $request ): string
{
    $widget = (string) ( $request->get_param( 'widget' ) ?: 'all' );

    return in_array( $widget, [ 'all', 'games' ], true ) ? $widget : 'all';
}

/**
 * @return array{items: array<string, list<array<string, mixed>>>|null, available: bool, widget_mode: string}
 */
function niceeins_extension_games_for_streamer( Streamer $streamer ): array
{
    $widget_mode = niceeins_extension_games_public_widget( $streamer );
    if ( $widget_mode === 'off' ) {
        return [
            'items'       => null,
            'available'   => niceeins_extension_games_repository_available(),
            'widget_mode' => 'off',
        ];
    }

    if ( ! niceeins_extension_games_repository_available() ) {
        return [
            'items'       => null,
            'available'   => false,
            'widget_mode' => $widget_mode,
        ];
    }

    try {
        $repo = new PlayedGameRepository();

        return [
            'items'       => [
                'currently_playing' => niceeins_extension_played_games_to_array(
                    $repo->findPublicForUser( $streamer->user_id, 'currently_playing', 5 ),
                    $streamer
                ),
                'recently_played'   => niceeins_extension_played_games_to_array(
                    $repo->findPublicForUser( $streamer->user_id, 'recently_played', 5 ),
                    $streamer
                ),
                'top_rated'         => niceeins_extension_played_games_to_array(
                    $repo->findPublicForUser( $streamer->user_id, 'top_rated', 3 ),
                    $streamer
                ),
            ],
            'available'   => true,
            'widget_mode' => $widget_mode,
        ];
    } catch ( Throwable ) {
        return [
            'items'       => null,
            'available'   => false,
            'widget_mode' => $widget_mode,
        ];
    }
}

function niceeins_extension_games_public_widget( Streamer $streamer ): string
{
    global $wpdb;

    $table = $wpdb->base_prefix . 'niceeins_streamers';

    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
    $value = $wpdb->get_var(
        $wpdb->prepare(
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            "SELECT games_public_widget FROM {$table} WHERE user_id = %d LIMIT 1",
            $streamer->user_id
        )
    );

    $value = is_string( $value ) ? $value : 'off';

    return in_array( $value, [ 'off', 'currently', 'recent', 'rated', 'all' ], true ) ? $value : 'off';
}

/**
 * @param array<int, mixed> $games
 * @return list<array<string, mixed>>
 */
function niceeins_extension_played_games_to_array( array $games, Streamer $streamer ): array
{
    $items = [];

    foreach ( $games as $game ) {
        if ( ! $game instanceof PlayedGame ) {
            continue;
        }

        $items[] = niceeins_extension_played_game_to_array( $game, $streamer );
    }

    return $items;
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_played_game_to_array( PlayedGame $game, Streamer $streamer ): array
{
    return [
        'id'               => $game->id,
        'title'            => $game->title,
        'slug'             => $game->slug,
        'cover_url'        => $game->cover_url,
        'status'           => $game->status,
        'status_label'     => method_exists( $game, 'statusLabel' )
            ? $game->statusLabel()
            : niceeins_extension_game_status_label( $game->status ),
        'status_color'     => method_exists( $game, 'statusColor' )
            ? $game->statusColor()
            : niceeins_extension_game_status_color( $game->status ),
        'rating'           => $game->rating,
        'last_streamed_at' => niceeins_extension_datetime_to_utc_iso( $game->last_streamed_at ),
        'completed_at'     => niceeins_extension_datetime_to_utc_iso( $game->completed_at ),
        'profile_url'      => niceeins_extension_game_profile_url( $streamer, $game ),
    ];
}

function niceeins_extension_game_profile_url( Streamer $streamer, PlayedGame $game ): string
{
    $login = strtolower( (string) $streamer->twitch_login );
    $base  = 'https://' . rawurlencode( $login ) . '.nice1.id';

    return $base . '/?game=' . rawurlencode( $game->slug );
}

function niceeins_extension_game_status_label( string $status ): string
{
    return match ( $status ) {
        'planned' => 'Geplant',
        'playing' => 'Spiele aktuell',
        'paused' => 'Pausiert',
        'completed' => 'Durchgespielt',
        'dropped' => 'Abgebrochen',
        default => $status,
    };
}

function niceeins_extension_game_status_color( string $status ): string
{
    return match ( $status ) {
        'playing' => '#10b981',
        'paused' => '#f59e0b',
        'completed' => '#3b82f6',
        'dropped' => '#ef4444',
        default => '#6b7280',
    };
}

/**
 * @return array<string, mixed>
 */
function niceeins_extension_command_to_array( Command $command ): array
{
    return [
        'id'               => $command->id,
        'command'          => $command->command,
        'description'      => $command->description,
        'example'          => $command->example,
        'category'         => $command->category,
        'category_label'   => method_exists( $command, 'categoryLabel' )
            ? $command->categoryLabel()
            : niceeins_extension_command_category_label( $command->category ),
        'permission'       => $command->permission,
        'permission_label' => method_exists( $command, 'permissionLabel' )
            ? $command->permissionLabel()
            : niceeins_extension_command_permission_label( $command->permission ),
        'permission_color' => '#' . ltrim(
            method_exists( $command, 'permissionColor' )
                ? $command->permissionColor()
                : niceeins_extension_command_permission_color( $command->permission ),
            '#'
        ),
        'is_visible'       => $command->is_visible,
    ];
}

function niceeins_extension_command_category_label( string $category ): string
{
    return match ( $category ) {
        'info' => 'Information',
        'social' => 'Social Media',
        'game' => 'Spiel',
        'mod' => 'Moderation',
        'fun' => 'Fun',
        default => 'Sonstiges',
    };
}

function niceeins_extension_command_permission_label( string $permission ): string
{
    return match ( $permission ) {
        'vip' => 'VIP',
        'moderator' => 'Moderator',
        'broadcaster' => 'Streamer',
        default => 'Alle',
    };
}

function niceeins_extension_command_permission_color( string $permission ): string
{
    return match ( $permission ) {
        'vip' => 'e005b9',
        'moderator' => '00ad03',
        'broadcaster' => 'e91916',
        default => '6b7280',
    };
}

function niceeins_extension_datetime_to_utc_iso( DateTimeInterface|string|null $value ): ?string
{
    if ( $value instanceof DateTimeInterface ) {
        return DateTimeImmutable::createFromInterface( $value )
            ->setTimezone( new DateTimeZone( 'UTC' ) )
            ->format( 'Y-m-d\TH:i:s\Z' );
    }

    if ( ! is_string( $value ) || trim( $value ) === '' ) {
        return null;
    }

    try {
        return ( new DateTimeImmutable( $value, new DateTimeZone( 'UTC' ) ) )
            ->setTimezone( new DateTimeZone( 'UTC' ) )
            ->format( 'Y-m-d\TH:i:s\Z' );
    } catch ( Throwable ) {
        return null;
    }
}

/**
 * @return list<array<string, mixed>>
 */
function niceeins_extension_links_for_streamer( Streamer $streamer ): array
{
    $links = [];

    if ( class_exists( SocialRepository::class ) ) {
        foreach ( ( new SocialRepository() )->findByUser( $streamer->user_id ) as $social ) {
            if ( ! $social instanceof Social || ! $social->is_visible || $social->url === '' ) {
                continue;
            }

            $links[] = [
                'id'         => $social->id,
                'network'    => $social->network,
                'label'      => $social->label ?: niceeins_extension_label_for_network( $social->network ),
                'url'        => $social->url,
                'sort_order' => $social->sort_order,
            ];
        }
    }

    if ( $streamer->discord_invite !== null && ! niceeins_extension_has_link( $links, $streamer->discord_invite ) ) {
        $links[] = [
            'id'         => null,
            'network'    => 'discord',
            'label'      => 'Discord',
            'url'        => $streamer->discord_invite,
            'sort_order' => 900,
        ];
    }

    if ( $streamer->twitch_login !== null ) {
        $twitch_url = 'https://twitch.tv/' . rawurlencode( $streamer->twitch_login );
        if ( ! niceeins_extension_has_link( $links, $twitch_url ) ) {
            $links[] = [
                'id'         => null,
                'network'    => 'twitch',
                'label'      => 'Twitch',
                'url'        => $twitch_url,
                'sort_order' => 1000,
            ];
        }
    }

    usort(
        $links,
        static fn( array $a, array $b ): int => ( (int) $a['sort_order'] ) <=> ( (int) $b['sort_order'] )
    );

    return array_values( $links );
}

/**
 * @param list<array<string, mixed>> $links
 */
function niceeins_extension_has_link( array $links, string $url ): bool
{
    foreach ( $links as $link ) {
        if ( isset( $link['url'] ) && rtrim( (string) $link['url'], '/' ) === rtrim( $url, '/' ) ) {
            return true;
        }
    }

    return false;
}

function niceeins_extension_label_for_network( string $network ): string
{
    return match ( $network ) {
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
function niceeins_extension_auth_context( WP_REST_Request $request ): array
{
    $token = niceeins_extension_bearer_token( $request );
    if ( $token === '' ) {
        return [ 'status' => 'missing' ];
    }

    $secret = niceeins_extension_secret();
    if ( $secret === '' ) {
        return [ 'status' => 'unconfigured' ];
    }

    $parts = explode( '.', $token );
    if ( count( $parts ) !== 3 ) {
        return [
			'status' => 'invalid',
			'reason' => 'malformed',
        ];
    }

    $header  = niceeins_extension_json_part( $parts[0] );
    $payload = niceeins_extension_json_part( $parts[1] );
    if ( ! is_array( $header ) || ! is_array( $payload ) || ( $header['alg'] ?? '' ) !== 'HS256' ) {
        return [
			'status' => 'invalid',
			'reason' => 'unsupported_token',
        ];
    }

    $expected = niceeins_extension_base64url_encode(
        hash_hmac( 'sha256', $parts[0] . '.' . $parts[1], $secret, true )
    );
    if ( ! hash_equals( $expected, $parts[2] ) ) {
        return [
			'status' => 'invalid',
			'reason' => 'signature',
        ];
    }

    if ( isset( $payload['exp'] ) && (int) $payload['exp'] < time() ) {
        return [
			'status' => 'invalid',
			'reason' => 'expired',
        ];
    }

    return array_filter(
        [
			'status'     => 'verified',
			'channel_id' => isset( $payload['channel_id'] ) ? (string) $payload['channel_id'] : null,
			'user_id'    => isset( $payload['user_id'] ) ? (string) $payload['user_id'] : null,
			'role'       => isset( $payload['role'] ) ? (string) $payload['role'] : null,
        ],
        static fn( $value ): bool => $value !== null && $value !== ''
    );
}

function niceeins_extension_bearer_token( WP_REST_Request $request ): string
{
    $header = (string) $request->get_header( 'authorization' );
    if ( preg_match( '/^Bearer\s+(.+)$/i', $header, $matches ) !== 1 ) {
        return '';
    }

    return trim( $matches[1] );
}

function niceeins_extension_secret(): string
{
    $configured = defined( 'NICEEINS_TWITCH_EXTENSION_SECRET' )
        ? (string) constant( 'NICEEINS_TWITCH_EXTENSION_SECRET' )
        : (string) get_option( 'niceeins_twitch_extension_secret', '' );
    $configured = trim( $configured );
    if ( $configured === '' ) {
        $configured = trim( (string) getenv( 'NICEEINS_TWITCH_EXTENSION_SECRET' ) );
    }

    // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Twitch Extension secrets may be stored base64 encoded.
    $decoded = base64_decode( $configured, true );

    return $decoded !== false ? $decoded : $configured;
}

/**
 * @return array<string, mixed>|null
 */
function niceeins_extension_json_part( string $part ): ?array
{
    $json = niceeins_extension_base64url_decode( $part );
    if ( $json === false ) {
        return null;
    }

    $decoded = json_decode( $json, true );

    return is_array( $decoded ) ? $decoded : null;
}

/**
 * @return string|false
 */
function niceeins_extension_base64url_decode( string $value )
{
    $remainder = strlen( $value ) % 4;
    if ( $remainder > 0 ) {
        $value .= str_repeat( '=', 4 - $remainder );
    }

    // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- JWT segments are base64url encoded.
    return base64_decode( strtr( $value, '-_', '+/' ), true );
}

function niceeins_extension_base64url_encode( string $value ): string
{
    // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- JWT signatures use base64url encoding.
    return rtrim( strtr( base64_encode( $value ), '+/', '-_' ), '=' );
}

/**
 * @param array<string, mixed> $auth
 *
 * @return array<string, mixed>
 */
function niceeins_extension_auth_meta( array $auth ): array
{
    return array_filter(
        [
			'status'           => $auth['status'] ?? 'missing',
			'resolved_channel' => $auth['channel_id'] ?? null,
			'role'             => $auth['role'] ?? null,
			'reason'           => $auth['reason'] ?? null,
        ],
        static fn( $value ): bool => $value !== null && $value !== ''
    );
}

function niceeins_extension_cors_response( WP_REST_Response $response ): WP_REST_Response
{
    $response->header( 'Access-Control-Allow-Origin', '*' );
    $response->header( 'Access-Control-Allow-Headers', 'Authorization, Content-Type' );
    $response->header( 'Vary', 'Authorization' );
    $response->header( 'Cache-Control', 'max-age=60, public' );

    return $response;
}
