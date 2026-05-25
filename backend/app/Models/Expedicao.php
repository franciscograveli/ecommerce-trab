<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expedicao extends Model
{
    protected $table = 'expedicoes';

    protected $fillable = [
        'pedido_id',
        'status_logistica',
        'transportadora',
        'codigo_rastreio',
        'valor_frete',
    ];

    public function pedido()
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }
}
