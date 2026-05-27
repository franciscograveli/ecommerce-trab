<?php

namespace App\Controllers;

use App\Models\Usuario;
use App\Models\Token;
use App\Models\Perfil;
use App\Middleware\Auth;

class AuthController
{
    public function login(array $params): void
    {
        $body  = bodyParams();
        $email = $body['email'] ?? null;
        $senha = $body['senha'] ?? null;

        if (!$email || !$senha) {
            json(['erro' => 'E-mail e senha são obrigatórios'], 422);
        }

        $usuario = Usuario::where('email', $email)->with(['perfil', 'representante', 'comprador'])->first();

        if (!$usuario || !password_verify($senha, $usuario->senha)) {
            json(['erro' => 'Credenciais inválidas'], 401);
        }

        $token = Token::create([
            'usuario_id' => $usuario->id,
            'token'      => bin2hex(random_bytes(32)),
            'expires_at' => date('Y-m-d H:i:s', strtotime('+8 hours')),
        ]);

        $perfil = $usuario->perfil->nome ?? null;

        $dadosPerfil = [];
        if ($perfil === Perfil::REPRESENTANTE && $usuario->representante) {
            $dadosPerfil['representante'] = ['id' => $usuario->representante->id];
        } elseif ($perfil === Perfil::COMPRADOR && $usuario->comprador) {
            $dadosPerfil['comprador'] = [
                'id'         => $usuario->comprador->id,
                'cliente_id' => $usuario->comprador->cliente_id,
            ];
        }

        json(array_merge([
            'token'   => $token->token,
            'usuario' => [
                'id'     => $usuario->id,
                'nome'   => $usuario->nome,
                'email'  => $usuario->email,
                'perfil' => $perfil,
            ],
        ], $dadosPerfil));
    }

    public function logout(array $params): void
    {
        Token::where('token', bearerToken())->delete();
        json(['mensagem' => 'Logout realizado com sucesso']);
    }
}
