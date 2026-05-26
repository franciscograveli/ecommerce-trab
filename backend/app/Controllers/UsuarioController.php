<?php

namespace App\Controllers;

use App\Models\Usuario;
use App\Models\Representante;
use App\Models\Comprador;
use App\Middleware\Auth;

class UsuarioController
{
    public function index(array $params): void
    {
        Auth::handle();
        json(Usuario::with(['perfil', 'representante'])->get()->toArray());
    }

    public function show(array $params): void
    {
        $usuario = Usuario::with(['perfil', 'representante', 'comprador'])->find($params['id']);
        if (!$usuario) json(['erro' => 'Usuário não encontrado'], 404);
        json($usuario->toArray());
    }

    public function store(array $params): void
    {
        $body = bodyParams();

        foreach (['perfil_id', 'nome', 'email', 'senha'] as $campo) {
            if (empty($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        if (Usuario::where('email', $body['email'])->exists()) {
            json(['erro' => 'E-mail já cadastrado'], 409);
        }

        $usuario = Usuario::create([
            'perfil_id' => $body['perfil_id'],
            'nome'      => $body['nome'],
            'email'     => $body['email'],
            'senha'     => password_hash($body['senha'], PASSWORD_BCRYPT),
        ]);

        $perfil = $usuario->perfil()->first();

        if ($perfil && $perfil->nome === 'representante') {
            Representante::create([
                'usuario_id'          => $usuario->id,
                'percentual_comissao' => $body['percentual_comissao'] ?? 0.00,
            ]);
        }

        if ($perfil && $perfil->nome === 'comprador') {
            if (empty($body['cliente_id'])) {
                json(['erro' => "Campo 'cliente_id' é obrigatório para compradores"], 422);
            }
            Comprador::create([
                'usuario_id' => $usuario->id,
                'cliente_id' => $body['cliente_id'],
            ]);
        }

        json($usuario->load('perfil')->toArray(), 201);
    }

    public function update(array $params): void
    {
        $usuario = Usuario::find($params['id']);
        if (!$usuario) json(['erro' => 'Usuário não encontrado'], 404);

        $body = bodyParams();
        if (!empty($body['senha'])) {
            $body['senha'] = password_hash($body['senha'], PASSWORD_BCRYPT);
        } else {
            unset($body['senha']);
        }

        $usuario->fill(array_intersect_key($body, array_flip(['nome', 'email', 'senha', 'perfil_id'])));
        $usuario->save();

        json($usuario->load('perfil')->toArray());
    }

    public function destroy(array $params): void
    {
        $usuario = Usuario::find($params['id']);
        if (!$usuario) json(['erro' => 'Usuário não encontrado'], 404);

        $usuario->delete();
        json(['mensagem' => 'Usuário removido com sucesso']);
    }
}
