<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model as Eloquent;

class BaseModel extends Eloquent
{
    //
    protected $connection = 'mongodb';
    public $timestamps = false;


}
