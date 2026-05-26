<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produto extends Model
{
    protected $table = 'produtos';

    protected $fillable = ['nome', 'descricao'];

    public function grades()
    {
        return $this->hasMany(Grade::class, 'produto_id');
    }

    public function precos()
    {
        return $this->hasMany(ProdutoPreco::class, 'produto_id');
    }
}
