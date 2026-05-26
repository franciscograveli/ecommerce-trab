<?php

namespace App\Middleware;

use App\Models\Usuario;

class Auth
{
    public static function handle(): array
    {
        $raw = bearerToken();

        if (!$raw) {
            json(['erro' => 'Token não informado'], 401);
        }

        $usuario = Usuario::where('token_autenticacao', $raw)
            ->with('perfil')
            ->first();

        if (!$usuario) {
            json(['erro' => 'Token inválido ou expirado'], 401);
        }

        return $usuario->toArray();
    }
}
