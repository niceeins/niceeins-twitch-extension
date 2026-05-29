<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real Streamer DTO from niceeins-streamsync. */
readonly class Streamer {

    public function __construct(
        public int $user_id,
        public ?string $display_name,
        public string $timezone,
        public ?string $twitch_user_id,
        public ?string $twitch_login,
        public string $broadcaster_type,
        public ?int $home_blog_id,
        public ?string $custom_domain,
        public string $status,
        public bool $schedule_public,
        public ?string $profile_image_url,
        public string $accent_color,
        public ?string $bio,
        public ?string $banner_url,
        public ?string $discord_invite,
        public bool $is_live,
        public ?string $live_game,
        public ?string $live_title,
        public ?string $live_since,
        public ?string $live_checked_at,
        public string $created_at,
        public string $updated_at,
        public string $profile_theme,
        public ?string $subsite_wizard_dismissed_at,
        public ?string $terms_accepted_at,
        public string $profile_games_section,
        public bool $profile_games_show_clips,
        public bool $game_suggestions_enabled,
        public bool $discord_game_suggestions_accepted_enabled,
        public bool $profile_clips_enabled,
        public int $profile_clips_count,
        public string $profile_clips_period,
        public bool $sponsor_active = false,
        public ?string $sponsor_name = null,
        public ?string $sponsor_description = null,
        public ?string $sponsor_logo_url = null,
        public ?string $sponsor_link = null,
        public bool $sponsor_affiliate_active = false,
        public ?string $sponsor_affiliate_text = null,
        /** @var list<string> */
        public array $profile_badges = [],
        public bool $discord_weekly_enabled = false,
        public int $discord_weekly_weekday = 7,
        public string $discord_weekly_time = '18:00',
        public string $panel_tabs_enabled = '',
        public bool $panel_badges_enabled = false,
        public bool $schedule_public_panel = true,
        public ?string $twitch_profile_banner_url = null,
        public ?string $twitch_offline_image_url = null,
    ) {}
}
