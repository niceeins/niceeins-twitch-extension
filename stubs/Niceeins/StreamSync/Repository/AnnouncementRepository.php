<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

use DateTimeImmutable;

/** @api PHPStan stub — mirrors the real AnnouncementRepository from niceeins-streamsync. */
class AnnouncementRepository {

    public function __construct() {}

    public function find( int $id ): ?Announcement { return null; }

    /**
     * @return Announcement[]
     */
    public function findActiveByUser( int $user_id, ?DateTimeImmutable $at = null ): array { return []; }

    /**
     * @return Announcement[]
     */
    public function findByUser( int $user_id ): array { return []; }
}
