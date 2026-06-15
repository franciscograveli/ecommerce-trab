<?php

use App\Controllers\AuthController;
use App\Controllers\UsuarioController;
use App\Controllers\EmpresaController;
use App\Controllers\ProdutoController;
use App\Controllers\PedidoController;
use App\Controllers\EstoqueController;
use App\Controllers\ExpedicaoController;
use App\Controllers\RmaController;
use App\Models\Perfil;

$A  = Perfil::ADMIN;
$R  = Perfil::REPRESENTANTE;
$C  = Perfil::COMPRADOR;

$router->post('/auth/login',  [AuthController::class, 'login']);
$router->delete('/auth/logout', [AuthController::class, 'logout'], []);

$router->get('/usuarios',         [UsuarioController::class, 'index'],   [$A]);
$router->post('/usuarios',        [UsuarioController::class, 'store'],   [$A]);
$router->get('/usuarios/{id}',    [UsuarioController::class, 'show'],    [$A]);
$router->put('/usuarios/{id}',    [UsuarioController::class, 'update'],  [$A]);
$router->delete('/usuarios/{id}', [UsuarioController::class, 'destroy'], [$A]);

$router->get('/empresas',         [EmpresaController::class, 'index'],   [$A, $R]);
$router->post('/empresas',        [EmpresaController::class, 'store'],   [$A, $R]);
$router->get('/empresas/{id}',    [EmpresaController::class, 'show'],    [$A, $R]);
$router->put('/empresas/{id}',    [EmpresaController::class, 'update'],  [$A, $R]);
$router->delete('/empresas/{id}', [EmpresaController::class, 'destroy'], [$A]);

$router->get('/produtos',         [ProdutoController::class, 'index'],   [$A, $R, $C]);
$router->post('/produtos',        [ProdutoController::class, 'store'],   [$A]);
$router->get('/produtos/tabelas',         [ProdutoController::class, 'indexTabelas'],  [$A, $R, $C]);
$router->post('/produtos/tabelas',        [ProdutoController::class, 'storeTabela'],   [$A]);
$router->put('/produtos/tabelas/{tid}',   [ProdutoController::class, 'updateTabela'],  [$A]);
$router->delete('/produtos/tabelas/{tid}',[ProdutoController::class, 'destroyTabela'], [$A]);
$router->get('/produtos/{id}',            [ProdutoController::class, 'show'],          [$A, $R, $C]);
$router->put('/produtos/{id}',            [ProdutoController::class, 'update'],        [$A]);
$router->delete('/produtos/{id}',         [ProdutoController::class, 'destroy'],       [$A]);

$router->get('/produtos/{id}/grades',          [ProdutoController::class, 'indexGrades'],  [$A, $R, $C]);
$router->post('/produtos/{id}/grades',         [ProdutoController::class, 'storeGrade'],   [$A]);
$router->delete('/produtos/{id}/grades/{gid}', [ProdutoController::class, 'destroyGrade'], [$A]);

$router->get('/produtos/{id}/precos',          [ProdutoController::class, 'indexPrecos'],  [$A, $R, $C]);
$router->post('/produtos/{id}/precos',         [ProdutoController::class, 'storePreco'],   [$A]);
$router->delete('/produtos/{id}/precos/{pid}', [ProdutoController::class, 'destroyPreco'], [$A]);

$router->get('/pedidos',         [PedidoController::class, 'index'],  [$A, $R, $C]);
$router->post('/pedidos',        [PedidoController::class, 'store'],  [$A, $C, $R]);
$router->get('/pedidos/{id}',    [PedidoController::class, 'show'],   [$A, $R, $C]);
$router->put('/pedidos/{id}',    [PedidoController::class, 'update'], [$A, $R]);
$router->delete('/pedidos/{id}', [PedidoController::class, 'cancel'], [$A, $R, $C]);

$router->get('/pedidos/{id}/itens',          [PedidoController::class, 'indexItens'],  [$A, $R, $C]);
$router->post('/pedidos/{id}/itens',         [PedidoController::class, 'storeItem'],   [$A, $C, $R]);
$router->delete('/pedidos/{id}/itens/{iid}', [PedidoController::class, 'destroyItem'], [$A, $C, $R]);

$router->get('/estoque',    [EstoqueController::class, 'index'],         [$A, $R]);
$router->post('/estoque/entrada', [EstoqueController::class, 'entrada'], [$A]);
$router->post('/estoque/saida',   [EstoqueController::class, 'saida'],   [$A]);
$router->get('/depositos',  [EstoqueController::class, 'indexDepositos'],[$A, $R]);
$router->post('/depositos', [EstoqueController::class, 'storeDeposito'], [$A]);

$router->get('/expedicao',              [ExpedicaoController::class, 'index'],       [$A, $R]);
$router->post('/expedicao',             [ExpedicaoController::class, 'store'],       [$A]);
$router->get('/expedicao/{id}',         [ExpedicaoController::class, 'show'],        [$A, $R]);
$router->put('/expedicao/{id}',         [ExpedicaoController::class, 'update'],      [$A]);
$router->post('/expedicao/{id}/boleto', [ExpedicaoController::class, 'storeBoleto'], [$A]);

$router->get('/rma',      [RmaController::class, 'index'],  [$A, $R, $C]);
$router->post('/rma',     [RmaController::class, 'store'],  [$C]);
$router->get('/rma/{id}', [RmaController::class, 'show'],   [$A, $R, $C]);
$router->put('/rma/{id}/status', [RmaController::class, 'update'], [$A, $R]);
