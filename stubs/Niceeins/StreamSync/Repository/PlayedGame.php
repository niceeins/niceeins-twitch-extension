<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

use DateTimeImmutable;

/** @api PHPStan stub — mirrors the real PlayedGame DTO from niceeins-streamsync. */
readonly class PlayedGame {

    public const STATUS_PLANNED   = 'planned';
    public const STATUS_PLAYING   = 'playing';
    public const STATUS_PAUSED    = 'paused';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_DROPPED   = 'dropped';

    /** @var list<string> */
    public const VALID_STATUSES = [
        self::STATUS_PLANNED, self::STATUS_PLAYING, self::STATUS_PAUSED,
        self::STATUS_COMPLETED, self::STATUS_DROPPED,
    ];

    public const SOURCE_AUTO     = 'auto';
    public const SOURCE_MANUAL   = 'manual';
    public const SOURCE_IMPORTED = 'imported';

    /** @var list<string> */
    public const VALID_SOURCES = [ self::SOURCE_AUTO, self::SOURCE_MANUAL, self::SOURCE_IMPORTED ];

    public const VISIBILITY_PUBLIC  = 'public';
    public const VISIBILITY_PRIVATE = 'private';

    /** @var list<string> */
    public const VALID_VISIBILITIES = [ self::VISIBILITY_PUBLIC, self::VISIBILITY_PRIVATE ];

    /** @var array<string, string> */
    public const STATUS_LABELS = [
        self::STATUS_PLANNED   => 'Geplant',
        self::STATUS_PLAYING   => 'Aktuell',
        self::STATUS_PAUSED    => 'Pausiert',
        self::STATUS_COMPLETED => 'Durchgespielt',
        self::STATUS_DROPPED   => 'Abgebrochen',
    ];

    /** @var array<string, string> */
    public const STATUS_COLORS = [
        self::STATUS_PLANNED   => '#6b7280',
        self::STATUS_PLAYING   => '#10b981',
        self::STATUS_PAUSED    => '#f59e0b',
        self::STATUS_COMPLETED => '#3b82f6',
        self::STATUS_DROPPED   => '#ef4444',
    ];

    public function __construct(
        public int $id,
        public int $user_id,
        public ?string $twitch_game_id,
        public ?int $igdb_id,
        public ?string $igdb_summary,
        public ?string $igdb_summary_de,
        public ?string $igdb_summary_de_source,
        public ?DateTimeImmutable $igdb_summary_de_updated_at,
        public ?float $igdb_rating,
        /** @var list<string> */
        public array $igdb_genres,
        /** @var list<string> */
        public array $igdb_screenshots,
        public string $title,
        public string $slug,
        public ?string $cover_url,
        public ?string $platform,
        public string $status,
        public ?DateTimeImmutable $completed_at,
        public ?int $rating,
        public ?int $stream_rating,
        public ?int $chat_rating,
        public ?string $review_text,
        public ?string $review_html,
        public ?DateTimeImmutable $first_streamed_at,
        public ?DateTimeImmutable $last_streamed_at,
        public int $stream_count,
        public int $total_stream_minutes,
        public string $source,
        public ?string $auto_source,
        public bool $manually_edited,
        public ?DateTimeImmutable $edited_by_user_at,
        public string $visibility,
        public string $created_at,
        public string $updated_at,
    ) {}

    public function statusLabel(): string { return ''; }

    public function statusColor(): string { return ''; }

    public static function labelForStatus( string $status ): string { return $status; }

    public static function colorForStatus( string $status ): string { return '#6b7280'; }

    /** @param array<string, mixed> $row */
    public static function fromRow( array $row ): self { return new self(0,0,null,null,null,null,null,null,null,[],[],'',' ',null,null,'playing',null,null,null,null,null,null,null,null,0,0,'auto',null,false,null,'public','',''); }
}
