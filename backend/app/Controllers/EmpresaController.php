<?php

namespace App\Controllers;

use App\Models\Cliente;
use App\Models\Representante;
use App\Models\Perfil;
use App\Middleware\Auth;

class EmpresaController
{
    public function index(array $params): void
    {
        json(Cliente::with('representante.usuario')->get()->toArray());
    }

    public function show(array $params): void
    {
        $cliente = Cliente::with(['representante.usuario', 'compradores.usuario'])->find($params['id']);
        if (!$cliente) json(['erro' => 'Empresa não encontrada'], 404);
        json($cliente->toArray());
    }

    public function store(array $params): void
    {
        $usuario = Auth::handle();
        $body    = bodyParams();

        foreach (['razao_social', 'cnpj'] as $campo) {
            if (empty($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        if (Cliente::where('cnpj', $body['cnpj'])->exists()) {
            json(['erro' => 'CNPJ já cadastrado'], 409);
        }

        if (($usuario['perfil']['nome'] ?? null) === Perfil::REPRESENTANTE) {
            $repId = Representante::where('usuario_id', $usuario['id'])->value('id');
            $body['representante_id'] = $repId;
        }

        $cliente = Cliente::create([
            'razao_social'       => $body['razao_social'],
            'cnpj'               => $body['cnpj'],
            'inscricao_estadual' => $body['inscricao_estadual'] ?? null,
            'limite_credito'     => $body['limite_credito'] ?? 0.00,
            'representante_id'   => $body['representante_id'] ?? null,
        ]);

        json($cliente->toArray(), 201);
    }

    public function update(array $params): void
    {
        $cliente = Cliente::find($params['id']);
        if (!$cliente) json(['erro' => 'Empresa não encontrada'], 404);

        $body = bodyParams();
        $cliente->fill(array_intersect_key($body, array_flip([
            'razao_social', 'cnpj', 'inscricao_estadual', 'limite_credito', 'representante_id',
        ])));
        $cliente->save();

        json($cliente->toArray());
    }

    public function destroy(array $params): void
    {
        $cliente = Cliente::find($params['id']);
        if (!$cliente) json(['erro' => 'Empresa não encontrada'], 404);

        $cliente->delete();
        json(['mensagem' => 'Empresa removida com sucesso']);
    }
}
