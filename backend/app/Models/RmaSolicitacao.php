<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RmaSolicitacao extends Model
{
    protected $table = 'rma_solicitacoes';

    protected $fillable = [
        'pedido_id',
        'comprador_id',
        'tipo',
        'motivo',
        'status',
    ];

    public function pedido()
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    public function comprador()
    {
        return $this->belongsTo(Comprador::class, 'comprador_id');
    }
}
