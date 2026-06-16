<?php

namespace App\Controllers;

use App\Models\RmaSolicitacao;
use App\Models\Pedido;
use App\Models\Estoque;
use App\Models\Perfil;
use App\Middleware\Auth;

class RmaController
{
    public function index(array $params): void
    {
        $usuario = Auth::handle();
        $query   = RmaSolicitacao::with(['pedido.cliente', 'comprador.usuario']);

        if (($usuario['perfil']['nome'] ?? null) === Perfil::COMPRADOR) {
            $compradorId = $usuario['comprador']['id'] ?? null;
            $query->where('comprador_id', $compradorId);
        }

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
        $usuario = Auth::handle();
        $body    = bodyParams();

        foreach (['pedido_id', 'comprador_id', 'tipo', 'motivo'] as $campo) {
            if (empty($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        if (!in_array($body['tipo'], ['troca', 'devolucao'])) {
            json(['erro' => "Tipo deve ser 'troca' ou 'devolucao'"], 422);
        }

        if (($usuario['perfil']['nome'] ?? null) === Perfil::COMPRADOR) {
            if (empty($usuario['comprador'])) {
                $usuario['comprador'] = \App\Models\Comprador::where('usuario_id', $usuario['id'])->first()?->toArray();
            }
            $body['comprador_id'] = $usuario['comprador']['id'] ?? null;
        }

        $pedido = Pedido::find($body['pedido_id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);

        if (($usuario['perfil']['nome'] ?? null) === Perfil::COMPRADOR) {
            if ($pedido->cliente_id !== ($usuario['comprador']['cliente_id'] ?? null)) {
                json(['erro' => 'Pedido não pertence à sua empresa'], 403);
            }
        }

        if (!in_array($pedido->status, ['enviado', 'entregue'])) {
            json(['erro' => 'RMA só pode ser aberto para pedidos enviados ou entregues'], 422);
        }

        // Impede duplicidade de RMA para o mesmo pedido (exceto se o anterior foi rejeitado)
        $rmaExistente = RmaSolicitacao::where('pedido_id', $body['pedido_id'])
            ->where('status', '!=', 'rejeitado')
            ->exists();

        if ($rmaExistente) {
            json(['erro' => 'Já existe uma solicitação de RMA ativa ou concluída para este pedido'], 409);
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

        $transicoes = [
            'aberto'     => ['em_analise', 'rejeitado'],
            'em_analise' => ['aprovado', 'rejeitado'],
            'aprovado'   => ['concluido'],
            'rejeitado'  => [],
            'concluido'  => [],
        ];

        if (!empty($body['status'])) {
            if (!isset($transicoes[$rma->status]) || !in_array($body['status'], $transicoes[$rma->status])) {
                json(['erro' => "Transição de '{$rma->status}' para '{$body['status']}' não permitida"], 422);
            }
        }

        $statusAnterior = $rma->status;

        if (!empty($body['status'])) $rma->status = $body['status'];
        $rma->save();

        // Devolução concluída: devolve itens ao estoque
        if ($rma->status === 'concluido' && $statusAnterior !== 'concluido' && $rma->tipo === 'devolucao') {
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
