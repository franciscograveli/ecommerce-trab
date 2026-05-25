<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deposito extends Model
{
    protected $table = 'depositos';

    public $timestamps = false;

    protected $fillable = ['nome', 'localizacao'];

    public function estoques()
    {
        return $this->hasMany(Estoque::class, 'deposito_id');
    }
}
