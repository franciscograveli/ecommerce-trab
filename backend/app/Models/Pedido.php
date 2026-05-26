<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pedido extends Model
{
    protected $table = 'pedidos';

    protected $fillable = [
        'cliente_id',
        'comprador_id',
        'representante_id',
        'status',
        'valor_total',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function comprador()
    {
        return $this->belongsTo(Comprador::class, 'comprador_id');
    }

    public function representante()
    {
        return $this->belongsTo(Representante::class, 'representante_id');
    }

    public function itens()
    {
        return $this->hasMany(PedidoItem::class, 'pedido_id');
    }

    public function expedicao()
    {
        return $this->hasOne(Expedicao::class, 'pedido_id');
    }

    public function boletos()
    {
        return $this->hasMany(Boleto::class, 'pedido_id');
    }

    public function rmaSolicitacoes()
    {
        return $this->hasMany(RmaSolicitacao::class, 'pedido_id');
    }
}
