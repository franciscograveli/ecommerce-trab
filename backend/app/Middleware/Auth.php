<?php

namespace App\Middleware;

use App\Models\Token;

class Auth
{
    private static ?array $usuarioCache = null;

    public static function handle(): array
    {
        if (self::$usuarioCache !== null) {
            return self::$usuarioCache;
        }

        $raw = bearerToken();

        if (!$raw) {
            json(['erro' => 'Token não informado'], 401);
        }

        $token = Token::where('token', $raw)
            ->where('expires_at', '>', date('Y-m-d H:i:s'))
            ->with('usuario.perfil')
            ->first();

        if (!$token) {
            json(['erro' => 'Token inválido ou expirado'], 401);
        }

        self::$usuarioCache = $token->usuario->toArray();

        return self::$usuarioCache;
    }

    public static function user(): ?array
    {
        return self::$usuarioCache;
    }

    public static function require(string ...$roles): array
    {
        $usuario = self::handle();
        $perfil  = $usuario['perfil']['nome'] ?? null;

        if (!in_array($perfil, $roles, true)) {
            json([
                'erro'    => 'Acesso negado',
                'detalhe' => "Perfil '{$perfil}' não tem permissão para este recurso",
            ], 403);
        }

        return $usuario;
    }
}
