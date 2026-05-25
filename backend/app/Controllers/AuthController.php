<?php

namespace App\Controllers;

use App\Models\Usuario;
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

        $usuario = Usuario::where('email', $email)->with('perfil')->first();

        if (!$usuario || !password_verify($senha, $usuario->senha)) {
            json(['erro' => 'Credenciais inválidas'], 401);
        }

        $token = bin2hex(random_bytes(32));
        $usuario->token_autenticacao = $token;
        $usuario->save();

        json([
            'token'   => $token,
            'usuario' => [
                'id'     => $usuario->id,
                'nome'   => $usuario->nome,
                'email'  => $usuario->email,
                'perfil' => $usuario->perfil->nome ?? null,
            ],
        ]);
    }

    public function logout(array $params): void
    {
        $usuario = Auth::handle();
        Usuario::where('id', $usuario['id'])->update(['token_autenticacao' => null]);
        json(['mensagem' => 'Logout realizado com sucesso']);
    }
}
