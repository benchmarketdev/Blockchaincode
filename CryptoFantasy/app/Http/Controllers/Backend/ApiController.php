<?php

namespace App\Http\Controllers\Backend;

use App\Models\BaseEthProvider;
use App\Models\Celebrity;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Common;

class ApiController extends Controller
{
    //
    public function viewAthlete($team_id) {
        header('Access-Control-Allow-Origin:*');
        return response()->json(Common::getAthleteFromTeam($team_id));
    }
    public function getMarketplaceMenu() {
        header('Access-Control-Allow-Origin:*');
        return response()->json(Common::getMarketplaceTreeData());
    }
    public function setAthleteToTokenId($athlete_id) {
        header('Access-Control-Allow-Origin:*');
        $token_id = request()->get('token_id');
        $owner = request()->get('owner');
        $athleteModel = new Celebrity();
        $athlete_data = $athleteModel->find($athlete_id);
        $athlete_data->token_id = $token_id;
        $athlete_data->card_status = 'normal';
//        $athlete_data->owner = $owner;
        $athlete_data->transactions = 0;
        $athlete_data->save();
        
        return response()->json('ok');
    }
    public function getEthProviderConfig() {
        header('Access-Control-Allow-Origin:*');

        $model = new BaseEthProvider();
        $data = $model->all()->first();
        return response()->json($data);
    }
}
