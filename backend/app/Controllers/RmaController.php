<?php

namespace App\Controllers;

use App\Models\RmaSolicitacao;
use App\Models\Pedido;
use App\Models\Estoque;
use App\Middleware\Auth;

class RmaController
{
    public function index(array $params): void
    {
        $query = RmaSolicitacao::with(['pedido.cliente', 'comprador.usuario']);

        if (!empty($_GET['status']))       $query->where('status', $_GET['status']);
        if (!empty($_GET['comprador_id'])) $query->where('comprador_id', $_GET['comprador_id']);

        json($query->get()->toArray());
    }

    public function show(array $params): void
    {
        $rma = RmaSolicitacao::with(['pedido.cliente', 'pedido.itens.grade', 'comprador.usuario'])->find($params['id']);
        if (!$rma) json(['erro' => 'Solicitação RMA não encontrada'], 404);
        json($rma->toArray());
    }

    public function store(array $params): void
    {
        $body = bodyParams();

        foreach (['pedido_id', 'comprador_id', 'tipo', 'motivo'] as $campo) {
            if (empty($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        if (!in_array($body['tipo'], ['troca', 'devolucao'])) {
            json(['erro' => "Tipo deve ser 'troca' ou 'devolucao'"], 422);
        }

        $pedido = Pedido::find($body['pedido_id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);

        if (!in_array($pedido->status, ['enviado', 'entregue'])) {
            json(['erro' => 'RMA só pode ser aberto para pedidos enviados ou entregues'], 422);
        }

        $rma = RmaSolicitacao::create([
            'pedido_id'    => $body['pedido_id'],
            'comprador_id' => $body['comprador_id'],
            'tipo'         => $body['tipo'],
            'motivo'       => $body['motivo'],
            'status'       => 'aberto',
        ]);

        json($rma->toArray(), 201);
    }

    public function update(array $params): void
    {
        $rma = RmaSolicitacao::find($params['id']);
        if (!$rma) json(['erro' => 'Solicitação RMA não encontrada'], 404);

        $body = bodyParams();
        $statusValidos = ['aberto', 'em_analise', 'aprovado', 'rejeitado', 'concluido'];

        if (!empty($body['status']) && !in_array($body['status'], $statusValidos)) {
            json(['erro' => 'Status inválido'], 422);
        }

        $statusAnterior = $rma->status;

        if (!empty($body['status'])) $rma->status = $body['status'];
        $rma->save();

        // Devolução concluída: devolve itens ao estoque
        if ($body['status'] === 'concluido' && $statusAnterior !== 'concluido' && $rma->tipo === 'devolucao') {
            $this->incrementarEstoque($rma);
        }

        json($rma->toArray());
    }

    private function incrementarEstoque(RmaSolicitacao $rma): void
    {
        $itens = $rma->pedido()->with('itens')->first()?->itens ?? [];

        foreach ($itens as $item) {
            $estoque = Estoque::where('grade_id', $item->grade_id)->first();

            if ($estoque) {
                $estoque->increment('quantidade', $item->quantidade);
            }
        }
    }
}
