<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

use DateTimeImmutable;

/** @api PHPStan stub — mirrors the real Schedule DTO from niceeins-streamsync. */
readonly class Schedule {

    public const PENDING = 'pending';
    public const SYNCING = 'syncing';
    public const SYNCED  = 'synced';
    public const FAILED  = 'failed';

    public function __construct(
        public int $id,
        public int $user_id,
        public ?string $title,
        public ?string $twitch_category_id,
        public ?string $twitch_category_name,
        public ?string $twitch_category_image,
        public DateTimeImmutable $starts_at,
        public DateTimeImmutable $ends_at,
        public ?string $recurrence_rule,
        public bool $is_cancelled,
        public ?string $twitch_segment_id,
        public string $sync_state,
        public ?string $sync_hash,
        public int $sync_attempts,
        public ?string $last_sync_at,
        public ?string $last_sync_error,
        public ?string $discord_notified_at,
        /** @var list<array{title: string, category_name: string, category_id: string, offset_minutes: int, duration_minutes: int}> */
        public array $agenda_items,
        public string $created_at,
        public string $updated_at,
    ) {}
}
