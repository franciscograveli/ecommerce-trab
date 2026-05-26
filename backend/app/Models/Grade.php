<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $table = 'grades';

    protected $fillable = ['produto_id', 'sku', 'cor', 'tamanho', 'voltagem'];

    public function produto()
    {
        return $this->belongsTo(Produto::class, 'produto_id');
    }

    public function estoques()
    {
        return $this->hasMany(Estoque::class, 'grade_id');
    }

    public function pedidoItens()
    {
        return $this->hasMany(PedidoItem::class, 'grade_id');
    }
}
