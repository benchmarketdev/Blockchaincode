<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\User;

class Message extends BaseModel
{
    //
    protected $collection = 'ppl_message';
    public $timestamps = true;

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
