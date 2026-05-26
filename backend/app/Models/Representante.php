<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Representante extends Model
{
    protected $table = 'representantes';

    protected $fillable = ['usuario_id', 'percentual_comissao'];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function clientes()
    {
        return $this->hasMany(Cliente::class, 'representante_id');
    }

    public function pedidos()
    {
        return $this->hasMany(Pedido::class, 'representante_id');
    }
}
