<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Usuario extends Model
{
    protected $table = 'usuarios';

    protected $fillable = ['perfil_id', 'nome', 'email', 'senha', 'token_autenticacao'];

    protected $hidden = ['senha', 'token_autenticacao'];

    public function perfil()
    {
        return $this->belongsTo(Perfil::class, 'perfil_id');
    }

    public function representante()
    {
        return $this->hasOne(Representante::class, 'usuario_id');
    }

    public function comprador()
    {
        return $this->hasOne(Comprador::class, 'usuario_id');
    }
}
