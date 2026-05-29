<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real Social DTO from niceeins-streamsync. */
readonly class Social {

    public function __construct(
        public int $id,
        public int $user_id,
        public string $network,
        public ?string $label,
        public string $url,
        public int $sort_order,
        public bool $is_visible,
        public string $created_at,
        public string $updated_at,
        public ?string $description = null,
    ) {}

    /** @var list<string> */
    public const VALID_NETWORKS = [
        'discord', 'youtube', 'x', 'tiktok', 'instagram',
        'bluesky', 'twitch', 'steam', 'github', 'website', 'custom',
    ];

    /** @var array<string, string> */
    public const NETWORK_LABELS = [
        'discord'   => 'Discord',
        'youtube'   => 'YouTube',
        'x'         => 'X',
        'tiktok'    => 'TikTok',
        'instagram' => 'Instagram',
        'bluesky'   => 'Bluesky',
        'twitch'    => 'Twitch',
        'steam'     => 'Steam',
        'github'    => 'GitHub',
        'website'   => 'Website',
        'custom'    => 'Link',
    ];

    public static function networkLabel( string $network ): string { return $network; }

    public function displayLabel(): string { return ''; }

    public static function detectNetwork( string $url ): string { return 'custom'; }
}
