#!/usr/bin/env php
<?php

/**
 * Insere dados mínimos de teste no banco.
 * Uso: php cli/seed.php
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';

use Illuminate\Database\Capsule\Manager as DB;

$perfis = DB::table('perfis')->pluck('id', 'nome');

if ($perfis->isEmpty()) {
    echo "❌ Tabela 'perfis' vazia. Execute o schema.sql primeiro.\n";
    exit(1);
}

if (!DB::table('usuarios')->where('email', 'admin@test.com')->exists()) {
    DB::table('usuarios')->insert([
        'perfil_id' => $perfis['admin'],
        'nome'      => 'Admin Teste',
        'email'     => 'admin@test.com',
        'senha'     => password_hash('123456', PASSWORD_BCRYPT),
    ]);
    echo "Usuário admin criado\n";
} else {
    echo "Usuário admin já existe\n";
}

if (!DB::table('usuarios')->where('email', 'rep@test.com')->exists()) {
    $uid = DB::table('usuarios')->insertGetId([
        'perfil_id' => $perfis['representante'],
        'nome'      => 'Representante Teste',
        'email'     => 'rep@test.com',
        'senha'     => password_hash('123456', PASSWORD_BCRYPT),
    ]);
    DB::table('representantes')->insert([
        'usuario_id'          => $uid,
        'percentual_comissao' => 5.00,
    ]);
    echo "Usuário representante criado\n";
} else {
    echo "⏭  Usuário representante já existe\n";
}

$repUid = DB::table('usuarios')->where('email', 'rep@test.com')->value('id');
$repId  = DB::table('representantes')->where('usuario_id', $repUid)->value('id');

// Cliente
if (!DB::table('clientes')->where('cnpj', '00.000.000/0001-00')->exists()) {
    DB::table('clientes')->insert([
        'razao_social'     => 'Empresa Teste Ltda',
        'cnpj'             => '00.000.000/0001-00',
        'limite_credito'   => 50000.00,
        'representante_id' => $repId,
    ]);
    echo "✅ Cliente criado\n";
} else {
    echo "⏭  Cliente já existe\n";
}

$clienteId = DB::table('clientes')->where('cnpj', '00.000.000/0001-00')->value('id');

if (!DB::table('usuarios')->where('email', 'comp@test.com')->exists()) {
    $uid = DB::table('usuarios')->insertGetId([
        'perfil_id' => $perfis['comprador'],
        'nome'      => 'Comprador Teste',
        'email'     => 'comp@test.com',
        'senha'     => password_hash('123456', PASSWORD_BCRYPT),
    ]);
    DB::table('compradores')->insert([
        'usuario_id' => $uid,
        'cliente_id' => $clienteId,
    ]);
    echo "Usuário comprador criado\n";
} else {
    echo "Usuário comprador já existe\n";
}

echo "\nSeed concluído!\n";
