<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real SocialRepository from niceeins-streamsync. */
class SocialRepository {

    public function __construct() {}

    /**
     * @return Social[]
     */
    public function findByUser( int $user_id, bool $visible_only = false ): array { return []; }
}
