<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real StreamerRepository from niceeins-streamsync. */
class StreamerRepository {

    public function __construct() {}

    public function find( int $user_id ): ?Streamer { return null; }

    public function findByTwitchLogin( string $login ): ?Streamer { return null; }

    public function findByDomain( string $domain ): ?Streamer { return null; }
}
