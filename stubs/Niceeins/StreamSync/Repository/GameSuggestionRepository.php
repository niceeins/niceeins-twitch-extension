<?php

declare(strict_types=1);

namespace Niceeins\StreamSync\Repository;

/** @api PHPStan stub — mirrors the real GameSuggestionRepository from niceeins-streamsync. */
class GameSuggestionRepository {

    public const MAX_GAME_NAME_LENGTH = 255;
    public const MAX_NAME_LENGTH      = 80;
    public const MAX_MESSAGE_LENGTH   = 1000;

    public function __construct() {}

    public function find( int $id ): ?GameSuggestion { return null; }

    /**
     * @return GameSuggestion[]
     */
    public function findByUser( int $user_id ): array { return []; }

    /**
     * @return GameSuggestion[]
     */
    public function findPublicByUser( int $user_id ): array { return []; }
}
