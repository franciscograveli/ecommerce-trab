<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Boleto extends Model
{
    protected $table = 'boletos';

    public $timestamps = false;

    protected $fillable = [
        'pedido_id',
        'linha_digitavel',
        'url_pdf',
        'data_vencimento',
        'status',
    ];

    public function pedido()
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }
}
