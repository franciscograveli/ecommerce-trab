<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Perfil extends Model
{
    const ADMIN         = 'admin';
    const REPRESENTANTE = 'representante';
    const COMPRADOR     = 'comprador';

    protected $table = 'perfis';

    public $timestamps = false;

    protected $fillable = ['nome'];

    public function usuarios()
    {
        return $this->hasMany(Usuario::class, 'perfil_id');
    }
}