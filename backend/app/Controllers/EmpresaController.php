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
        $usuario = Auth::handle();
        $query   = Cliente::with('representante.usuario');

        if (($usuario['perfil']['nome'] ?? null) === Perfil::REPRESENTANTE) {
            $repId = Representante::where('usuario_id', $usuario['id'])->value('id');
            $query->where('representante_id', $repId);
        }

        json($query->get()->toArray());
    }

    public function show(array $params): void
    {
        $usuario = Auth::handle();
        $cliente = Cliente::with(['representante.usuario', 'compradores.usuario'])->find($params['id']);

        if (!$cliente) json(['erro' => 'Empresa não encontrada'], 404);

        if (($usuario['perfil']['nome'] ?? null) === Perfil::REPRESENTANTE) {
            $repId = Representante::where('usuario_id', $usuario['id'])->value('id');
            if ($cliente->representante_id !== $repId) {
                json(['erro' => 'Empresa não pertence à sua carteira'], 403);
            }
        }

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

        $isRep = ($usuario['perfil']['nome'] ?? null) === Perfil::REPRESENTANTE;

        $cliente = Cliente::create([
            'razao_social'            => $body['razao_social'],
            'cnpj'                    => $body['cnpj'],
            'inscricao_estadual'      => $body['inscricao_estadual'] ?? null,
            'limite_credito'          => $isRep ? 0.00 : ($body['limite_credito'] ?? 0.00),
            'limite_credito_proposto' => $isRep ? ($body['limite_credito_proposto'] ?? null) : null,
            'representante_id'        => $body['representante_id'] ?? null,
        ]);

        json($cliente->toArray(), 201);
    }

    public function update(array $params): void
    {
        $usuario = Auth::handle();
        $perfil  = $usuario['perfil']['nome'] ?? null;

        if (!in_array($perfil, [Perfil::ADMIN, Perfil::REPRESENTANTE])) {
            json(['erro' => 'Acesso negado'], 403);
        }

        $cliente = Cliente::find($params['id']);
        if (!$cliente) json(['erro' => 'Empresa não encontrada'], 404);

        if ($perfil === Perfil::REPRESENTANTE) {
            $repId = Representante::where('usuario_id', $usuario['id'])->value('id');
            if ($cliente->representante_id !== $repId) {
                json(['erro' => 'Empresa não pertence à sua carteira'], 403);
            }
        }

        $body   = bodyParams();
        $campos = ['razao_social', 'cnpj', 'inscricao_estadual', 'representante_id'];

        if ($perfil === Perfil::ADMIN) {
            $campos[] = 'limite_credito';
            // Ao admin definir o limite, limpa a proposta pendente
            if (isset($body['limite_credito'])) {
                $body['limite_credito_proposto'] = null;
                $campos[] = 'limite_credito_proposto';
            }
        }

        if ($perfil === Perfil::REPRESENTANTE) {
            $campos[] = 'limite_credito_proposto';
        }

        $cliente->fill(array_intersect_key($body, array_flip($campos)));
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
