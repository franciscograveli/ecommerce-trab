<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estoque extends Model
{
    protected $table = 'estoques';

    public $timestamps = false;

    protected $fillable = ['grade_id', 'deposito_id', 'quantidade'];

    public function grade()
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function deposito()
    {
        return $this->belongsTo(Deposito::class, 'deposito_id');
    }
}
