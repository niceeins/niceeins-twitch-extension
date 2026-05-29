<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real PlayedGameRepository from niceeins-streamsync. */
class PlayedGameRepository {

    public function __construct() {}

    public function find( int $id ): ?PlayedGame { return null; }

    /**
     * @return PlayedGame[]
     */
    public function findByUser( int $user_id ): array { return []; }

    /**
     * @return PlayedGame[]
     */
    public function findPublicByUser( int $user_id, string $sort = 'last_streamed', int $limit = 20 ): array { return []; }
}
