<?php

use App\Controllers\AuthController;
use App\Controllers\UsuarioController;
use App\Controllers\EmpresaController;
use App\Controllers\ProdutoController;
use App\Controllers\PedidoController;
use App\Controllers\EstoqueController;
use App\Controllers\ExpedicaoController;
use App\Controllers\RmaController;

$router->post('/auth/login',  [AuthController::class, 'login']);
$router->delete('/auth/logout', [AuthController::class, 'logout'], []);

$router->get('/usuarios',         [UsuarioController::class, 'index'],   ['admin']);
$router->post('/usuarios',        [UsuarioController::class, 'store'],   ['admin']);
$router->get('/usuarios/{id}',    [UsuarioController::class, 'show'],    ['admin']);
$router->put('/usuarios/{id}',    [UsuarioController::class, 'update'],  ['admin']);
$router->delete('/usuarios/{id}', [UsuarioController::class, 'destroy'], ['admin']);

$router->get('/empresas',         [EmpresaController::class, 'index'],   ['admin', 'representante']);
$router->post('/empresas',        [EmpresaController::class, 'store'],   ['admin']);
$router->get('/empresas/{id}',    [EmpresaController::class, 'show'],    ['admin', 'representante']);
$router->put('/empresas/{id}',    [EmpresaController::class, 'update'],  ['admin']);
$router->delete('/empresas/{id}', [EmpresaController::class, 'destroy'], ['admin']);

$router->get('/produtos',         [ProdutoController::class, 'index'],   ['admin', 'representante', 'comprador']);
$router->post('/produtos',        [ProdutoController::class, 'store'],   ['admin']);
$router->get('/produtos/tabelas', [ProdutoController::class, 'indexTabelas'], ['admin', 'representante', 'comprador']);
$router->post('/produtos/tabelas',[ProdutoController::class, 'storeTabela'],  ['admin']);
$router->get('/produtos/{id}',    [ProdutoController::class, 'show'],    ['admin', 'representante', 'comprador']);
$router->put('/produtos/{id}',    [ProdutoController::class, 'update'],  ['admin']);
$router->delete('/produtos/{id}', [ProdutoController::class, 'destroy'], ['admin']);

$router->get('/produtos/{id}/grades',          [ProdutoController::class, 'indexGrades'],  ['admin', 'representante', 'comprador']);
$router->post('/produtos/{id}/grades',         [ProdutoController::class, 'storeGrade'],   ['admin']);
$router->delete('/produtos/{id}/grades/{gid}', [ProdutoController::class, 'destroyGrade'], ['admin']);

$router->get('/produtos/{id}/precos',  [ProdutoController::class, 'indexPrecos'], ['admin', 'representante', 'comprador']);
$router->post('/produtos/{id}/precos', [ProdutoController::class, 'storePreco'],  ['admin']);

$router->get('/pedidos',         [PedidoController::class, 'index'],  ['admin', 'representante', 'comprador']);
$router->post('/pedidos',        [PedidoController::class, 'store'],  ['comprador', 'representante']);
$router->get('/pedidos/{id}',    [PedidoController::class, 'show'],   ['admin', 'representante', 'comprador']);
$router->put('/pedidos/{id}',    [PedidoController::class, 'update'], ['admin', 'representante']);
$router->delete('/pedidos/{id}', [PedidoController::class, 'cancel'], ['admin', 'representante', 'comprador']);

$router->get('/pedidos/{id}/itens',          [PedidoController::class, 'indexItens'],  ['admin', 'representante', 'comprador']);
$router->post('/pedidos/{id}/itens',         [PedidoController::class, 'storeItem'],   ['comprador']);
$router->delete('/pedidos/{id}/itens/{iid}', [PedidoController::class, 'destroyItem'], ['comprador', 'representante']);

$router->get('/estoque',    [EstoqueController::class, 'index'],         ['admin', 'representante']);
$router->post('/estoque/entrada', [EstoqueController::class, 'entrada'], ['admin']);
$router->post('/estoque/saida',   [EstoqueController::class, 'saida'],   ['admin']);
$router->get('/depositos',  [EstoqueController::class, 'indexDepositos'],['admin', 'representante']);
$router->post('/depositos', [EstoqueController::class, 'storeDeposito'], ['admin']);

$router->get('/expedicao',              [ExpedicaoController::class, 'index'],       ['admin', 'representante']);
$router->post('/expedicao',             [ExpedicaoController::class, 'store'],       ['admin']);
$router->get('/expedicao/{id}',         [ExpedicaoController::class, 'show'],        ['admin', 'representante']);
$router->put('/expedicao/{id}',         [ExpedicaoController::class, 'update'],      ['admin']);
$router->post('/expedicao/{id}/boleto', [ExpedicaoController::class, 'storeBoleto'], ['admin']);

$router->get('/rma',      [RmaController::class, 'index'],  ['admin', 'representante', 'comprador']);
$router->post('/rma',     [RmaController::class, 'store'],  ['comprador']);
$router->get('/rma/{id}', [RmaController::class, 'show'],   ['admin', 'representante', 'comprador']);
$router->put('/rma/{id}/status', [RmaController::class, 'update'], ['admin', 'representante']);
