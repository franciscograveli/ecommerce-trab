<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comissao extends Model
{
    protected $table = 'comissoes';

    protected $fillable = ['representante_id', 'pedido_id', 'valor', 'status'];

    public function representante()
    {
        return $this->belongsTo(Representante::class);
    }

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }
}
