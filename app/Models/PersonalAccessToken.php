<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ✅ Use Sanctum's default configuration
    // Do NOT override primary key - Sanctum expects 'id' column
    // This table is managed by Sanctum and uses standard 'id' primary key
}
