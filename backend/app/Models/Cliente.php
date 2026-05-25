<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'razao_social',
        'cnpj',
        'inscricao_estadual',
        'limite_credito',
        'representante_id',
    ];

    public function representante()
    {
        return $this->belongsTo(Representante::class, 'representante_id');
    }

    public function compradores()
    {
        return $this->hasMany(Comprador::class, 'cliente_id');
    }

    public function pedidos()
    {
        return $this->hasMany(Pedido::class, 'cliente_id');
    }
}
