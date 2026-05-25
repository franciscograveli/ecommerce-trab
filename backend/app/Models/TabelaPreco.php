<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TabelaPreco extends Model
{
    protected $table = 'tabelas_precos';

    public $timestamps = false;

    protected $fillable = ['nome', 'regra_volume_minimo'];

    public function produtoPrecos()
    {
        return $this->hasMany(ProdutoPreco::class, 'tabela_preco_id');
    }
}
