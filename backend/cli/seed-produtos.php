#!/usr/bin/env php
<?php

/**
 * Seed de produtos, grades e tabelas de preço — catálogo Dram Store.
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
        echo "✅ Tabela '{$t['nome']}' criada\n";
    } else {
        $id = $row->id;
        echo "⏭  Tabela '{$t['nome']}' já existe\n";
    }
    $tabelaIds[$t['nome']] = $id;
}

// ---- Produtos ----
// Fonte: dram_store_produtos.csv
// Cada produto tem uma única grade (sem variações de cor/tamanho).
// SKU, preço e descrição extraídos diretamente do CSV.

$defProdutos = [
    [
        'nome'      => 'Glenfarclas 12 Anos Single Malt Scotch Whisky 700ml',
        'descricao' => 'Single Malt Scotch Whisky da destilaria familiar Glenfarclas, Speyside, Escócia. Maturado exclusivamente em barris de Oloroso Sherry de Jerez. Notas de frutas secas, passas, mel e baunilha com leve toque defumado. ABV 43%, 700ml.',
        'grades'    => [['sku' => 'GFC-12-700']],
        'precos'    => ['Varejo' => 389.90],
    ],
    [
        'nome'      => 'Lagavulin 16 Anos Single Malt Scotch Whisky 700ml',
        'descricao' => 'Ícone dos whiskies de Islay. Intensamente turfado, com notas de iodo, alcatrão, frutas secas e fumaça persistente. Maturado em ex-bourbon e xerez europeu. ABV 43%, 700ml.',
        'grades'    => [['sku' => 'LGV-16-700']],
        'precos'    => ['Varejo' => 679.90],
    ],
    [
        'nome'      => 'Redbreast 12 Anos Single Pot Still Irish Whiskey 700ml',
        'descricao' => 'Referência absoluta do estilo Single Pot Still irlandês, produzido pela Midleton Distillery. Textura oleosa e cremosa com notas de frutas tropicais, maçã cozida, gengibre e noz-moscada. ABV 40%, 700ml.',
        'grades'    => [['sku' => 'RDB-12-700']],
        'precos'    => ['Varejo' => 459.90],
    ],
    [
        'nome'      => 'Buffalo Trace Kentucky Straight Bourbon Whiskey 750ml',
        'descricao' => 'Bourbon de excelente custo-benefício da lendária Buffalo Trace Distillery, Kentucky. Maturado em novas barricas de carvalho americano. Notas de baunilha, mel e caramelo. ABV 45%, 750ml.',
        'grades'    => [['sku' => 'BFT-NAS-750']],
        'precos'    => ['Varejo' => 289.90, 'Promocional' => 269.90],
    ],
    [
        'nome'      => 'Nikka From The Barrel Japanese Blended Whisky 500ml',
        'descricao' => 'Blended whisky japonês robusto e premiado, combinando maltes de Yoichi e Miyagikyo. Maturado em bourbon, xerez e mizunara. Notas de frutas maduras, mel, gengibre e especiarias. ABV 51,4%, 500ml.',
        'grades'    => [['sku' => 'NKF-NAS-500']],
        'precos'    => ['Varejo' => 579.90],
    ],
    [
        'nome'      => 'Ardbeg 10 Anos Single Malt Scotch Whisky Islay 700ml',
        'descricao' => 'Single Malt de Islay não filtrado a frio, referência mundial entre os whiskies turfados. Turfa agressiva, notas de café, chocolate amargo e cítricos. Final longíssimo e defumado. ABV 46%, 700ml.',
        'grades'    => [['sku' => 'ADB-10-700']],
        'precos'    => ['Varejo' => 469.90],
    ],
    [
        'nome'      => 'Woodford Reserve Kentucky Straight Bourbon Whiskey 700ml',
        'descricao' => 'Bourbon premium de Kentucky destilado em triplo em alambiques de cobre. Notas de frutas secas, caramelo, baunilha rica e pimenta branca. Final longo e suavemente picante. ABV 43,2%, 700ml.',
        'grades'    => [['sku' => 'WFR-NAS-700']],
        'precos'    => ['Varejo' => 319.90],
    ],
    [
        'nome'      => 'GlenDronach 12 Anos Single Malt Scotch Whisky Highlands 700ml',
        'descricao' => 'Single Malt das Highlands maturado 100% em barris de Pedro Ximénez e Oloroso Sherry. Aromas intensos de ameixa, uvas passas, chocolate amargo e toffee. Final longo com especiarias. ABV 43%, 700ml.',
        'grades'    => [['sku' => 'GDR-12-700']],
        'precos'    => ['Varejo' => 419.90],
    ],
    [
        'nome'      => 'Bulleit Rye American Rye Whiskey 700ml',
        'descricao' => 'American Rye Whiskey com 95% de centeio. Perfil picante, seco e versátil para cocktails clássicos como Manhattan e Old Fashioned. Notas de centeio, mentol, pimenta e baunilha. ABV 45%, 700ml.',
        'grades'    => [['sku' => 'BLT-RY-700']],
        'precos'    => ['Varejo' => 259.90],
    ],
    [
        'nome'      => 'Hakushu 12 Anos Japanese Single Malt Whisky Suntory 700ml',
        'descricao' => 'Japanese Single Malt da Suntory com perfil herbal e fresco único. Notas de pepino, frutas brancas, maçã verde e leve turfa. Alta demanda mundial com disponibilidade limitada. ABV 43%, 700ml.',
        'grades'    => [['sku' => 'HKS-12-700']],
        'precos'    => ['Varejo' => 999.90],
    ],
];

foreach ($defProdutos as $p) {
    $row = DB::table('produtos')->where('nome', $p['nome'])->first();
    if (!$row) {
        $produtoId = DB::table('produtos')->insertGetId([
            'nome'      => $p['nome'],
            'descricao' => $p['descricao'],
        ]);
        echo "✅ {$p['nome']}\n";
    } else {
        $produtoId = $row->id;
        echo "⏭  {$p['nome']}\n";
    }

    foreach ($p['grades'] as $g) {
        if (!DB::table('grades')->where('sku', $g['sku'])->exists()) {
            DB::table('grades')->insert([
                'produto_id' => $produtoId,
                'sku'        => $g['sku'],
                'cor'        => null,
                'tamanho'    => null,
                'voltagem'   => null,
            ]);
            echo "    ✅ Grade '{$g['sku']}'\n";
        } else {
            echo "    ⏭  Grade '{$g['sku']}'\n";
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
            echo "    ✅ Preço R\$ {$preco} ({$tabela})\n";
        } else {
            echo "    ⏭  Preço ({$tabela})\n";
        }
    }
}

echo "\nSeed de produtos concluído!\n";
