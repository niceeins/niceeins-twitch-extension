<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real Command DTO from niceeins-streamsync. */
readonly class Command {

    public function __construct(
        public int $id,
        public int $user_id,
        public string $command,
        public string $description,
        public ?string $example,
        public string $category,
        public string $permission,
        public int $sort_order,
        public bool $is_visible,
        public string $created_at,
        public string $updated_at,
    ) {}

    /** @var array<string, string> */
    public const CATEGORIES = [
        'info' => 'Information', 'social' => 'Social Media', 'game' => 'Spiel',
        'mod' => 'Moderation', 'fun' => 'Fun', 'other' => 'Sonstiges',
    ];

    /** @var array<string, array{label: string, color: string}> */
    public const PERMISSIONS = [
        'everyone'    => [ 'label' => 'Alle',       'color' => '6b7280' ],
        'vip'         => [ 'label' => 'VIP',         'color' => 'e005b9' ],
        'moderator'   => [ 'label' => 'Moderator',   'color' => '00ad03' ],
        'broadcaster' => [ 'label' => 'Streamer',    'color' => 'e91916' ],
    ];

    public const COMMAND_REGEX = '/^[!\/]?[A-Za-z0-9_äöüÄÖÜß-]{1,64}$/u';

    public function categoryLabel(): string { return ''; }

    public function permissionLabel(): string { return ''; }

    public function permissionColor(): string { return ''; }
}
