<?php

namespace App\Controllers;

use App\Models\Estoque;
use App\Models\Deposito;
use App\Models\Grade;

class EstoqueController
{
    public function index(array $params): void
    {
        $query = Estoque::with(['grade.produto', 'deposito']);

        if (!empty($_GET['deposito_id'])) $query->where('deposito_id', $_GET['deposito_id']);
        if (!empty($_GET['grade_id']))    $query->where('grade_id', $_GET['grade_id']);
        if (!empty($_GET['produto_id']))  $query->whereHas('grade', fn($q) => $q->where('produto_id', $_GET['produto_id']));

        json($query->get()->toArray());
    }

    // POST /estoque/entrada — incrementa quantidade
    public function entrada(array $params): void
    {
        $body = bodyParams();

        foreach (['grade_id', 'deposito_id', 'quantidade'] as $campo) {
            if (!isset($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        if ($body['quantidade'] <= 0) json(['erro' => 'Quantidade deve ser maior que zero'], 422);
        if (!Grade::find($body['grade_id']))      json(['erro' => 'Grade não encontrada'], 404);
        if (!Deposito::find($body['deposito_id'])) json(['erro' => 'Depósito não encontrado'], 404);

        $estoque = Estoque::firstOrNew([
            'grade_id'    => $body['grade_id'],
            'deposito_id' => $body['deposito_id'],
        ]);

        $estoque->quantidade = ($estoque->quantidade ?? 0) + $body['quantidade'];
        $estoque->save();

        json($estoque->load(['grade.produto', 'deposito'])->toArray());
    }

    // POST /estoque/saida — decrementa quantidade
    public function saida(array $params): void
    {
        $body = bodyParams();

        foreach (['grade_id', 'deposito_id', 'quantidade'] as $campo) {
            if (!isset($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        if ($body['quantidade'] <= 0) json(['erro' => 'Quantidade deve ser maior que zero'], 422);
        if (!Grade::find($body['grade_id']))      json(['erro' => 'Grade não encontrada'], 404);
        if (!Deposito::find($body['deposito_id'])) json(['erro' => 'Depósito não encontrado'], 404);

        $estoque = Estoque::where('grade_id', $body['grade_id'])
            ->where('deposito_id', $body['deposito_id'])
            ->first();

        if (!$estoque) json(['erro' => 'Registro de estoque não encontrado'], 404);

        $nova = $estoque->quantidade - $body['quantidade'];
        if ($nova < 0) json(['erro' => 'Estoque insuficiente'], 422);

        $estoque->quantidade = $nova;
        $estoque->save();

        json($estoque->load(['grade.produto', 'deposito'])->toArray());
    }

    public function indexDepositos(array $params): void
    {
        json(Deposito::all()->toArray());
    }

    public function storeDeposito(array $params): void
    {
        $body = bodyParams();
        if (empty($body['nome'])) json(['erro' => "Campo 'nome' é obrigatório"], 422);

        $deposito = Deposito::create([
            'nome'        => $body['nome'],
            'localizacao' => $body['localizacao'] ?? null,
        ]);

        json($deposito->toArray(), 201);
    }
}
