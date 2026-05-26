<?php

namespace App\Controllers;

use App\Models\Produto;
use App\Models\Grade;
use App\Models\TabelaPreco;
use App\Models\ProdutoPreco;
use App\Middleware\Auth;

class ProdutoController
{
    public function index(array $params): void
    {
        json(Produto::with('grades')->get()->toArray());
    }

    public function show(array $params): void
    {
        $produto = Produto::with(['grades', 'precos.tabelaPreco'])->find($params['id']);
        if (!$produto) json(['erro' => 'Produto não encontrado'], 404);
        json($produto->toArray());
    }

    public function store(array $params): void
    {
        $body = bodyParams();
        if (empty($body['nome'])) json(['erro' => "Campo 'nome' é obrigatório"], 422);

        $produto = Produto::create([
            'nome'      => $body['nome'],
            'descricao' => $body['descricao'] ?? null,
        ]);

        json($produto->toArray(), 201);
    }

    public function update(array $params): void
    {
        $produto = Produto::find($params['id']);
        if (!$produto) json(['erro' => 'Produto não encontrado'], 404);

        $body = bodyParams();
        $produto->fill(array_intersect_key($body, array_flip(['nome', 'descricao'])));
        $produto->save();

        json($produto->toArray());
    }

    public function destroy(array $params): void
    {
        $produto = Produto::find($params['id']);
        if (!$produto) json(['erro' => 'Produto não encontrado'], 404);

        $produto->delete();
        json(['mensagem' => 'Produto removido com sucesso']);
    }

    // ---- Grades ----

    public function indexGrades(array $params): void
    {
        $produto = Produto::find($params['id']);
        if (!$produto) json(['erro' => 'Produto não encontrado'], 404);
        json($produto->grades()->with('estoques.deposito')->get()->toArray());
    }

    public function storeGrade(array $params): void
    {
        $produto = Produto::find($params['id']);
        if (!$produto) json(['erro' => 'Produto não encontrado'], 404);

        $body = bodyParams();
        if (empty($body['sku'])) json(['erro' => "Campo 'sku' é obrigatório"], 422);

        if (Grade::where('sku', $body['sku'])->exists()) {
            json(['erro' => 'SKU já cadastrado'], 409);
        }

        $grade = Grade::create([
            'produto_id' => $params['id'],
            'sku'        => $body['sku'],
            'cor'        => $body['cor'] ?? null,
            'tamanho'    => $body['tamanho'] ?? null,
            'voltagem'   => $body['voltagem'] ?? null,
        ]);

        json($grade->toArray(), 201);
    }

    public function destroyGrade(array $params): void
    {
        $grade = Grade::where('produto_id', $params['id'])->find($params['gid']);
        if (!$grade) json(['erro' => 'Grade não encontrada'], 404);

        $grade->delete();
        json(['mensagem' => 'Grade removida com sucesso']);
    }

    // ---- Tabelas de preço ----

    public function indexTabelas(array $params): void
    {
        json(TabelaPreco::all()->toArray());
    }

    public function storeTabela(array $params): void
    {
        $body = bodyParams();
        if (empty($body['nome'])) json(['erro' => "Campo 'nome' é obrigatório"], 422);

        $tabela = TabelaPreco::create([
            'nome'                => $body['nome'],
            'regra_volume_minimo' => $body['regra_volume_minimo'] ?? 1,
        ]);

        json($tabela->toArray(), 201);
    }

    // ---- Preços ----

    public function indexPrecos(array $params): void
    {
        $produto = Produto::find($params['id']);
        if (!$produto) json(['erro' => 'Produto não encontrado'], 404);
        json($produto->precos()->with('tabelaPreco')->get()->toArray());
    }

    public function storePreco(array $params): void
    {
        $produto = Produto::find($params['id']);
        if (!$produto) json(['erro' => 'Produto não encontrado'], 404);

        $body = bodyParams();
        foreach (['tabela_preco_id', 'preco'] as $campo) {
            if (!isset($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        $preco = ProdutoPreco::updateOrCreate(
            ['produto_id' => $params['id'], 'tabela_preco_id' => $body['tabela_preco_id']],
            ['preco' => $body['preco']]
        );

        json($preco->toArray(), 201);
    }
}
