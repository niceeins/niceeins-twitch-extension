<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real GameSuggestion DTO from niceeins-streamsync. */
readonly class GameSuggestion {

    public const STATUS_NEW        = 'new';
    public const STATUS_INTERESTED = 'interested';
    public const STATUS_ACCEPTED   = 'accepted';
    public const STATUS_PLANNED    = 'planned';
    public const STATUS_REJECTED   = 'rejected';
    public const STATUS_PLAYED     = 'played';
    public const STATUS_MAYBE      = 'maybe';

    /** @var list<string> */
    public const VALID_STATUSES = [
        self::STATUS_NEW, self::STATUS_INTERESTED, self::STATUS_ACCEPTED,
        self::STATUS_PLANNED, self::STATUS_REJECTED, self::STATUS_PLAYED, self::STATUS_MAYBE,
    ];

    public const PUBLIC_STATUSES = [
        self::STATUS_NEW, self::STATUS_INTERESTED, self::STATUS_ACCEPTED,
        self::STATUS_PLANNED, self::STATUS_PLAYED, self::STATUS_MAYBE,
    ];

    public const SOURCE_PROFILE   = 'profile';
    public const SOURCE_PANEL     = 'panel';
    public const SOURCE_DASHBOARD = 'dashboard';

    /** @var list<string> */
    public const VALID_SOURCES = [ self::SOURCE_PROFILE, self::SOURCE_PANEL, self::SOURCE_DASHBOARD ];

    /** @var array<string, string> */
    public const STATUS_LABELS = [
        self::STATUS_NEW        => 'Neu',
        self::STATUS_INTERESTED => 'Interessant',
        self::STATUS_ACCEPTED   => 'Angenommen',
        self::STATUS_PLANNED    => 'Eingeplant',
        self::STATUS_REJECTED   => 'Abgelehnt',
        self::STATUS_PLAYED     => 'Gespielt',
        self::STATUS_MAYBE      => 'Vielleicht',
    ];

    /** @var array<string, string> */
    public const STATUS_COLORS = [
        self::STATUS_NEW        => '#6b7280',
        self::STATUS_INTERESTED => '#f59e0b',
        self::STATUS_ACCEPTED   => '#10b981',
        self::STATUS_PLANNED    => '#3b82f6',
        self::STATUS_REJECTED   => '#ef4444',
        self::STATUS_PLAYED     => '#10b981',
        self::STATUS_MAYBE      => '#8b5cf6',
    ];

    public function __construct(
        public int $id,
        public int $user_id,
        public string $game_name,
        public ?int $igdb_id,
        public ?string $twitch_game_id,
        public ?string $twitch_box_art_url,
        public ?string $suggested_by_name,
        public ?string $message,
        public int $votes,
        public string $status,
        public string $source,
        public ?string $ip_hash,
        public ?string $discord_acceptance_notified_at,
        public string $created_at,
        public string $updated_at,
    ) {}

    public function boxArtUrl( int $width = 80, int $height = 107 ): ?string { return null; }

    public function statusLabel(): string { return ''; }

    public function statusColor(): string { return ''; }

    /** @param array<string, mixed> $row */
    public static function fromRow( array $row ): self { return new self(0,0,'',null,null,null,null,null,0,'new','profile',null,null,'',''); }
}
