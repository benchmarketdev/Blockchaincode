<?php

namespace App\Models\Base;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Model;

class SportsTeam extends BaseModel
{
    //
    protected $collection = 'sports_team';
    public $timestamps = true;

    public function getTeamDataByType( $type_id = null ) {
        if ( is_null($type_id) ) {
            $data = $this->select('*')->orderBy('sports_type_id')->get();
        }
        else {
            $data = $this->where('sports_type_id', $type_id)->get();
        }
        if ( $data ) return $data->toArray();
        return [];
    }
}
