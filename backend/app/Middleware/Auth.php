<?php

namespace App\Middleware;

use App\Models\Token;

class Auth
{
    public static function handle(): array
    {
        $raw = bearerToken();

        if (!$raw) {
            json(['erro' => 'Token não informado'], 401);
        }

        $token = Token::where('token', $raw)
            ->where('expires_at', '>', date('Y-m-d H:i:s'))
            ->with('usuario')
            ->first();

        if (!$token) {
            json(['erro' => 'Token inválido ou expirado'], 401);
        }

        return $token->usuario->toArray();
    }
}
