<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProdutoPreco extends Model
{
    protected $table = 'produto_precos';

    public $timestamps = false;

    protected $fillable = ['produto_id', 'tabela_preco_id', 'preco'];

    public function produto()
    {
        return $this->belongsTo(Produto::class, 'produto_id');
    }

    public function tabelaPreco()
    {
        return $this->belongsTo(TabelaPreco::class, 'tabela_preco_id');
    }
}
