#!/usr/bin/env php
<?php

/**
 * Seed de produtos, grades e tabelas de preço.
 * Uso: php cli/seed-produtos.php
 * Idempotente: pode ser executado múltiplas vezes sem duplicar dados.
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';

use Illuminate\Database\Capsule\Manager as DB;

// ---- Tabelas de preço ----

$defTabelas = [
    ['nome' => 'Varejo',      'regiao' => null, 'regra_volume_minimo' => 1],
    ['nome' => 'Promocional', 'regiao' => null, 'regra_volume_minimo' => 1],
];

$tabelaIds = [];
foreach ($defTabelas as $t) {
    $row = DB::table('tabelas_precos')->where('nome', $t['nome'])->first();
    if (!$row) {
        $id = DB::table('tabelas_precos')->insertGetId($t);
        echo "✅ Tabela de preço '{$t['nome']}' criada\n";
    } else {
        $id  = $row->id;
        echo "⏭  Tabela de preço '{$t['nome']}' já existe\n";
    }
    $tabelaIds[$t['nome']] = $id;
}

// ---- Produtos ----

$defProdutos = [
    [
        'nome'      => 'Shorts',
        'descricao' => 'Um artigo imprescindível para o verão.',
        'grades'    => [
            ['sku' => 'SHORTS-001', 'cor' => null, 'tamanho' => null, 'voltagem' => null],
        ],
        'precos' => [
            'Varejo'      => 220.00,
            'Promocional' => 200.00,
        ],
    ],
    [
        'nome'      => 'Camisa de manga curta',
        'descricao' => 'Camisa tipica para o verão.',
        'grades'    => [
            ['sku' => 'CMC-BRANCO-G', 'cor' => 'Branco', 'tamanho' => 'G', 'voltagem' => null],
            ['sku' => 'A1234',        'cor' => 'Preto',  'tamanho' => 'G', 'voltagem' => null],
            ['sku' => 'B5678',        'cor' => 'Branco', 'tamanho' => 'M', 'voltagem' => null],
        ],
        'precos' => [
            'Varejo' => 450.00,
        ],
    ],
];

foreach ($defProdutos as $p) {
    $row = DB::table('produtos')->where('nome', $p['nome'])->first();
    if (!$row) {
        $produtoId = DB::table('produtos')->insertGetId([
            'nome'      => $p['nome'],
            'descricao' => $p['descricao'],
        ]);
        echo "✅ Produto '{$p['nome']}' criado\n";
    } else {
        $produtoId = $row->id;
        echo "⏭  Produto '{$p['nome']}' já existe\n";
    }

    foreach ($p['grades'] as $g) {
        if (!DB::table('grades')->where('sku', $g['sku'])->exists()) {
            DB::table('grades')->insert([
                'produto_id' => $produtoId,
                'sku'        => $g['sku'],
                'cor'        => $g['cor'],
                'tamanho'    => $g['tamanho'],
                'voltagem'   => $g['voltagem'],
            ]);
            echo "    ✅ Grade '{$g['sku']}' criada\n";
        } else {
            echo "    ⏭  Grade '{$g['sku']}' já existe\n";
        }
    }

    foreach ($p['precos'] as $tabela => $preco) {
        if (!isset($tabelaIds[$tabela])) continue;
        $tabelaId = $tabelaIds[$tabela];
        $existe = DB::table('produto_precos')
            ->where('produto_id', $produtoId)
            ->where('tabela_preco_id', $tabelaId)
            ->exists();
        if (!$existe) {
            DB::table('produto_precos')->insert([
                'produto_id'      => $produtoId,
                'tabela_preco_id' => $tabelaId,
                'preco'           => $preco,
            ]);
            echo "    ✅ Preço R\$ {$preco} ({$tabela}) criado\n";
        } else {
            echo "    ⏭  Preço ({$tabela}) já existe\n";
        }
    }
}

echo "\nSeed de produtos concluído!\n";
