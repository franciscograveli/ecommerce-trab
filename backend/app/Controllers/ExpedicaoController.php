<?php

namespace App\Controllers;

use App\Models\Expedicao;
use App\Models\Pedido;
use App\Models\Boleto;
use App\Middleware\Auth;

class ExpedicaoController
{
    public function index(array $params): void
    {
        $query = Expedicao::with(['pedido.cliente', 'pedido.itens.grade']);

        if (!empty($_GET['status_logistica'])) {
            $query->where('status_logistica', $_GET['status_logistica']);
        }

        json($query->get()->toArray());
    }

    public function show(array $params): void
    {
        $expedicao = Expedicao::with(['pedido.cliente', 'pedido.itens.grade', 'pedido.boletos'])->find($params['id']);
        if (!$expedicao) json(['erro' => 'Expedição não encontrada'], 404);
        json($expedicao->toArray());
    }

    public function store(array $params): void
    {
        $body = bodyParams();
        if (empty($body['pedido_id'])) json(['erro' => "Campo 'pedido_id' é obrigatório"], 422);

        $pedido = Pedido::find($body['pedido_id']);
        if (!$pedido) json(['erro' => 'Pedido não encontrado'], 404);

        if ($pedido->status !== 'aprovado') {
            json(['erro' => 'Só é possível abrir expedição para pedidos aprovados'], 422);
        }

        if (Expedicao::where('pedido_id', $body['pedido_id'])->exists()) {
            json(['erro' => 'Já existe uma expedição para este pedido'], 409);
        }

        $expedicao = Expedicao::create([
            'pedido_id'        => $body['pedido_id'],
            'status_logistica' => 'picking_pendente',
            'transportadora'   => $body['transportadora'] ?? null,
            'valor_frete'      => $body['valor_frete'] ?? null,
        ]);

        $pedido->status = 'em_separacao';
        $pedido->save();

        json($expedicao->toArray(), 201);
    }

    public function update(array $params): void
    {
        $expedicao = Expedicao::find($params['id']);
        if (!$expedicao) json(['erro' => 'Expedição não encontrada'], 404);

        $body = bodyParams();
        $statusValidos = ['picking_pendente', 'picking_concluido', 'packing', 'pronto_envio', 'em_transito'];

        if (!empty($body['status_logistica']) && !in_array($body['status_logistica'], $statusValidos)) {
            json(['erro' => 'Status logístico inválido'], 422);
        }

        $expedicao->fill(array_intersect_key($body, array_flip([
            'status_logistica', 'transportadora', 'codigo_rastreio', 'valor_frete',
        ])));
        $expedicao->save();

        if (!empty($body['status_logistica']) && $body['status_logistica'] === 'em_transito') {
            Pedido::where('id', $expedicao->pedido_id)->update(['status' => 'enviado']);
        }

        json($expedicao->toArray());
    }

    public function storeBoleto(array $params): void
    {
        $expedicao = Expedicao::find($params['id']);
        if (!$expedicao) json(['erro' => 'Expedição não encontrada'], 404);

        $body = bodyParams();
        foreach (['linha_digitavel', 'url_pdf', 'data_vencimento'] as $campo) {
            if (empty($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        $boleto = Boleto::create([
            'pedido_id'       => $expedicao->pedido_id,
            'linha_digitavel' => $body['linha_digitavel'],
            'url_pdf'         => $body['url_pdf'],
            'data_vencimento' => $body['data_vencimento'],
            'status'          => 'pendente',
        ]);

        json($boleto->toArray(), 201);
    }
}
