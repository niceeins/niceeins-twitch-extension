<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

use DateTimeImmutable;

/** @api PHPStan stub — mirrors the real ScheduleRepository from niceeins-streamsync. */
class ScheduleRepository {

    public function __construct() {}

    public function find( int $id ): ?Schedule { return null; }

    /**
     * @return Schedule[]
     */
    public function findByUser( int $user_id, ?DateTimeImmutable $from = null, ?DateTimeImmutable $to = null ): array { return []; }

    /**
     * @return Schedule[]
     */
    public function findUpcoming( int $user_id, int $limit = 5 ): array { return []; }
}
