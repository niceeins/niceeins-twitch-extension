<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real CommandRepository from niceeins-streamsync. */
class CommandRepository {

    public function __construct() {}

    public function find( int $id ): ?Command { return null; }

    /**
     * @return Command[]
     */
    public function findByUser( int $user_id, bool $visible_only = false ): array { return []; }
}
