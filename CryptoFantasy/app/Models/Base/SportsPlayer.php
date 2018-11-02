<?php

namespace App\Models\Base;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Model;

class SportsPlayer extends BaseModel
{
    //
    protected $collection = 'sports_player';
    public $timestamps = true;

    public function getPlayerListByTeam( $team_id ) {
        $data = $this->where('team_id', $team_id)->get();
        if ( $data ) return $data->toArray();
        return [];
    }
}
