<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

use DateTimeImmutable;

/** @api PHPStan stub — mirrors the real Announcement DTO from niceeins-streamsync. */
readonly class Announcement {

    public const SEVERITY_INFO   = 'info';
    public const SEVERITY_NOTICE = 'notice';
    public const SEVERITY_URGENT = 'urgent';

    /** @var list<string> */
    public const VALID_SEVERITIES = [ self::SEVERITY_INFO, self::SEVERITY_NOTICE, self::SEVERITY_URGENT ];

    public const PENDING = 'pending';
    public const SYNCING = 'syncing';
    public const SYNCED  = 'synced';
    public const FAILED  = 'failed';

    public function __construct(
        public int $id,
        public int $user_id,
        public string $severity,
        public ?string $title,
        public string $body,
        public ?string $body_html,
        public ?DateTimeImmutable $starts_at,
        public ?DateTimeImmutable $ends_at,
        public bool $is_pinned,
        public bool $is_archived,
        public bool $show_on_profile,
        public bool $show_in_panel,
        public bool $discord_push,
        public ?string $discord_message_id,
        public ?int $discord_webhook_id,
        public string $sync_state,
        public int $sync_attempts,
        public ?string $last_sync_at,
        public ?string $last_sync_error,
        public string $created_at,
        public string $updated_at,
    ) {}

    /** @param array<string, mixed> $row */
    public static function fromRow( array $row ): self { return new self(0,0,'info',null,'',null,null,null,false,false,true,true,false,null,null,'pending',0,null,null,'',''); }

    public function isActiveAt( DateTimeImmutable $now ): bool { return true; }

    public function severityColor(): string { return '3b82f6'; }

    public function severityLabel(): string { return 'Info'; }

    public function severityWeight(): int { return 1; }
}
