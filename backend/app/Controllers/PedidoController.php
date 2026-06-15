<?php

namespace App\Controllers;

use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Grade;
use App\Models\Cliente;
use App\Models\Estoque;
use App\Models\Representante;
use App\Models\Comissao;
use App\Models\ProdutoPreco;
use App\Models\Perfil;
use App\Middleware\Auth;

class PedidoController
{
    public function index(array $params): void
    {
        $usuario = Auth::handle();

        $query = Pedido::with(['cliente', 'comprador.usuario', 'representante.usuario', 'itens.grade']);

        if (($usuario['perfil']['nome'] ?? null) === Perfil::REPRESENTANTE) {
            $repId = Representante::where('usuario_id', $usuario['id'])->value('id');
            $query->whereHas('cliente', fn($q) => $q->where('representante_id', $repId));
        }

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
        $usuario = Auth::handle();
        $body    = bodyParams();
        $perfil  = $usuario['perfil']['nome'] ?? null;

        // Força dados do token — impede impersonação de comprador ou empresa
        if ($perfil === Perfil::COMPRADOR) {
            $body['comprador_id'] = $usuario['comprador']['id'] ?? null;
            $body['cliente_id']   = $usuario['comprador']['cliente_id'] ?? null;
        }

        if ($perfil === Perfil::REPRESENTANTE) {
            $repId = Representante::where('usuario_id', $usuario['id'])->value('id');
            $body['representante_id'] = $repId;

            $pertenceCarteira = Cliente::where('id', $body['cliente_id'] ?? null)
                ->where('representante_id', $repId)
                ->exists();
            if (!$pertenceCarteira) {
                json(['erro' => 'Empresa não pertence à sua carteira'], 403);
            }
        }

        foreach (['cliente_id', 'comprador_id'] as $campo) {
            if (empty($body[$campo])) json(['erro' => "Campo '{$campo}' é obrigatório"], 422);
        }

        // Herda representante da empresa caso não esteja definido (ex: pedido criado por admin)
        if (empty($body['representante_id'])) {
            $body['representante_id'] = Cliente::where('id', $body['cliente_id'])->value('representante_id');
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
        $statusValidos = ['orcamento', 'aguardando_aprovacao_credito', 'aguardando_estoque', 'aprovado', 'em_separacao', 'enviado', 'entregue', 'cancelado'];

        if (!empty($body['status']) && !in_array($body['status'], $statusValidos)) {
            json(['erro' => 'Status inválido'], 422);
        }

        if (!empty($body['status']) && $body['status'] === 'aprovado' && $pedido->status !== 'aprovado') {
            if ($pedido->status === 'orcamento') {
                $cliente = Cliente::find($pedido->cliente_id);
                if ($cliente && $pedido->valor_total > $cliente->limite_credito) {
                    $pedido->status = 'aguardando_aprovacao_credito';
                    $pedido->save();
                    json($pedido->toArray());
                }

                if (!$this->estoqueDisponivel($pedido)) {
                    $pedido->status = 'aguardando_estoque';
                    $pedido->save();
                    json($pedido->toArray());
                }
            }

            $this->validarEstoque($pedido);
            $this->decrementarEstoque($pedido);
            $this->gerarComissao($pedido);
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

        if ((int)$body['quantidade'] <= 0) {
            json(['erro' => 'Quantidade deve ser maior que zero'], 422);
        }
        if ((float)$body['preco_unitario'] < 0) {
            json(['erro' => 'Preço unitário não pode ser negativo'], 422);
        }

        $grade = Grade::with('produto')->find($body['grade_id']);
        if (!$grade) json(['erro' => 'Grade não encontrada'], 404);

        $produtoPreco = ProdutoPreco::with('tabelaPreco')
            ->where('produto_id', $grade->produto_id)
            ->whereRaw('ABS(preco - ?) < 0.01', [(float) $body['preco_unitario']])
            ->first();

        if ($produtoPreco && $produtoPreco->tabelaPreco) {
            $volMin = (int) ($produtoPreco->tabelaPreco->regra_volume_minimo ?? 1);
            if ((int) $body['quantidade'] < $volMin) {
                json(['erro' => "Quantidade mínima para esta tabela de preço é {$volMin} unidade(s)"], 422);
            }
        }

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

    private function estoqueDisponivel(Pedido $pedido): bool
    {
        foreach ($pedido->itens()->get() as $item) {
            $total = Estoque::where('grade_id', $item->grade_id)->sum('quantidade');
            if ($total < $item->quantidade) return false;
        }
        return true;
    }

    private function validarEstoque(Pedido $pedido): void
    {
        foreach ($pedido->itens()->get() as $item) {
            $totalEmEstoque = Estoque::where('grade_id', $item->grade_id)->sum('quantidade');
            if ($totalEmEstoque < $item->quantidade) {
                json([
                    'erro'       => 'Estoque insuficiente para aprovação do pedido',
                    'grade_id'   => $item->grade_id,
                    'disponivel' => $totalEmEstoque,
                    'necessario' => $item->quantidade,
                ], 422);
            }
        }
    }

    private function decrementarEstoque(Pedido $pedido): void
    {
        foreach ($pedido->itens()->get() as $item) {
            $restante = $item->quantidade;

            // Consome dos depósitos em ordem decrescente de quantidade (FIFO por maior saldo)
            $estoques = Estoque::where('grade_id', $item->grade_id)
                ->where('quantidade', '>', 0)
                ->orderBy('quantidade', 'desc')
                ->get();

            foreach ($estoques as $estoque) {
                if ($restante <= 0) break;
                $consumir = min($estoque->quantidade, $restante);
                $estoque->decrement('quantidade', $consumir);
                $restante -= $consumir;
            }
        }
    }

    private function gerarComissao(Pedido $pedido): void
    {
        if (!$pedido->representante_id) return;
        if (Comissao::where('pedido_id', $pedido->id)->exists()) return;

        $rep = Representante::find($pedido->representante_id);
        if (!$rep || !$rep->percentual_comissao) return;

        Comissao::create([
            'representante_id' => $rep->id,
            'pedido_id'        => $pedido->id,
            'valor'            => round($pedido->valor_total * $rep->percentual_comissao / 100, 2),
            'status'           => 'pendente',
        ]);
    }
}
