<?php

namespace App\Controllers;

use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Grade;
use App\Models\Cliente;
use App\Models\Estoque;
use App\Middleware\Auth;

class PedidoController
{
    public function index(array $params): void
    {
        $query = Pedido::with(['cliente', 'comprador.usuario', 'representante.usuario', 'itens.grade']);

        if (!empty($_GET['status']))     $query->where('status', $_GET['status']);
        if (!empty($_GET['cliente_id'])) $query->where('cliente_id', $_GET['cliente_id']);

        json($query->get()->toArray());
    }

    public function show(array $params): void
    {
        $pedido = Pedido::with([
            'cliente',
            'comprador.usuario',
            'representante.usuario',
            'itens.grade.produto',
            'expedicao',
            'boletos',
        ])->find($params['id']);

        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);
        json($pedido->toArray());
    }

    public function store(array $params): void
    {
        $body = bodyParams();

        foreach (['cliente_id', 'comprador_id'] as $campo) {
            if (empty($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        $pedido = Pedido::create([
            'cliente_id'       => $body['cliente_id'],
            'comprador_id'     => $body['comprador_id'],
            'representante_id' => $body['representante_id'] ?? null,
            'status'           => 'orcamento',
            'valor_total'      => 0.00,
        ]);

        json($pedido->toArray(), 201);
    }

    public function update(array $params): void
    {
        $pedido = Pedido::find($params['id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);

        $body = bodyParams();
        $statusValidos = ['orcamento', 'aguardando_aprovacao_credito', 'aprovado', 'em_separacao', 'enviado', 'entregue', 'cancelado'];

        if (!empty($body['status']) && !in_array($body['status'], $statusValidos)) {
            json(['erro' => 'Status inválido'], 422);
        }

        if (!empty($body['status']) && $body['status'] === 'aprovado') {
            $cliente = Cliente::find($pedido->cliente_id);
            if ($cliente && $pedido->valor_total > $cliente->limite_credito) {
                json(['erro' => 'Valor do pedido excede o limite de crédito do cliente'], 422);
            }

            $this->validarEstoque($pedido);
            $this->decrementarEstoque($pedido);
        }

        if (!empty($body['status'])) $pedido->status = $body['status'];
        $pedido->save();

        json($pedido->toArray());
    }

    public function cancel(array $params): void
    {
        $pedido = Pedido::find($params['id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);

        if (!in_array($pedido->status, ['orcamento', 'aguardando_aprovacao_credito'])) {
            json(['erro' => 'Apenas pedidos em orçamento ou aguardando aprovação podem ser cancelados'], 422);
        }

        $pedido->status = 'cancelado';
        $pedido->save();

        json(['mensagem' => 'Pedido cancelado com sucesso']);
    }

    // ---- Itens ----

    public function indexItens(array $params): void
    {
        $pedido = Pedido::find($params['id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);
        json($pedido->itens()->with('grade.produto')->get()->toArray());
    }

    public function storeItem(array $params): void
    {
        $pedido = Pedido::find($params['id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);

        if ($pedido->status !== 'orcamento') {
            json(['erro' => 'Itens só podem ser adicionados em pedidos com status "orcamento"'], 422);
        }

        $body = bodyParams();
        foreach (['grade_id', 'quantidade', 'preco_unitario'] as $campo) {
            if (!isset($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        if (!Grade::find($body['grade_id'])) json(['erro' => 'Grade não encontrada'], 404);

        $item = PedidoItem::create([
            'pedido_id'      => $params['id'],
            'grade_id'       => $body['grade_id'],
            'quantidade'     => $body['quantidade'],
            'preco_unitario' => $body['preco_unitario'],
        ]);

        $this->recalcularTotal($params['id'], $pedido);

        json($item->toArray(), 201);
    }

    public function destroyItem(array $params): void
    {
        $pedido = Pedido::find($params['id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);

        $item = PedidoItem::where('pedido_id', $params['id'])->find($params['iid']);
        if (!$item) json(['erro' => 'Item não encontrado'], 404);

        $item->delete();
        $this->recalcularTotal($params['id'], $pedido);

        json(['mensagem' => 'Item removido com sucesso']);
    }

    private function recalcularTotal(int $pedidoId, Pedido $pedido): void
    {
        $total = PedidoItem::where('pedido_id', $pedidoId)
            ->selectRaw('SUM(quantidade * preco_unitario) as total')
            ->value('total');

        $pedido->valor_total = $total ?? 0;
        $pedido->save();
    }

    private function validarEstoque(Pedido $pedido): void
    {
        $itens = $pedido->itens()->get();

        foreach ($itens as $item) {
            $totalEmEstoque = Estoque::where('grade_id', $item->grade_id)
                ->sum('quantidade');

            if ($totalEmEstoque < $item->quantidade) {
                json([
                    'erro'    => 'Estoque insuficiente para aprovação do pedido',
                    'grade_id'=> $item->grade_id,
                    'disponivel' => $totalEmEstoque,
                    'necessario' => $item->quantidade,
                ], 422);
            }
        }
    }

    private function decrementarEstoque(Pedido $pedido): void
    {
        foreach ($pedido->itens()->get() as $item) {
            // Decrementa do primeiro depósito com saldo suficiente
            $estoque = Estoque::where('grade_id', $item->grade_id)
                ->where('quantidade', '>=', $item->quantidade)
                ->orderBy('quantidade', 'desc')
                ->first();

            if ($estoque) {
                $estoque->decrement('quantidade', $item->quantidade);
            }
        }
    }
}
