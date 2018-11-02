<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Celebrity;
use App\Models\Common;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Base\SportsPlayer;
use App\Models\Base\SportsType;
use App\Models\Base\SportsTeam;
use App\Models\BaseEthProvider;
use Illuminate\Support\Facades\Crypt;

class MarketplaceController extends Controller
{
    //
    public function index() {
        $treeData = Common::getMarketplaceTreeData();
        $celebrities = Common::getCelebrityDetailInfo();
        return view('frontend.marketplace')->with(['athletes'=>$celebrities, 'tree_data'=>$treeData]);
    }
    public function viewAthlete($team_id) {
        header('Access-Control-Allow-Origin:*');
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        $ret = Common::getAthleteFromTeam($team_id);
        $team_name = Common::getTeamNamefromTeamId($team_id);
        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }
        return view('frontend.marketplace')->with(['athletes'=>$ret, 'provider'=>$provider, 'team_id'=>$team_id, 'team_name'=>$team_name, 'contractAddress'=>$contractAddress]);
    }
    public function getMarketplaceMenu() {
        header('Access-Control-Allow-Origin:*');
        return response()->json(Common::getMarketplaceTreeData());
    }
    public function showDetailsForAthlete($athlete_id) {
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }
        $athlete = Common::getAthleteInfo($athlete_id);
        $owner_history = Common::getOwnerHistoryOfAthlete($athlete_id);
        return view('frontend.marketplace.showathlete')->with(['athlete'=>$athlete, 'owner_history'=>$owner_history, 'provider'=>$provider, 'contractAddress'=>$contractAddress]);
    }

    public function showAthleteInfoByUser($user_id) {
        $userInfo = Common::getUserInfoFromId($user_id);
        $athlete = Common::getAthleteInfoOfOwner($user_id);
        $wallet_id = base64_decode($userInfo['wallet_id']);
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }
        return view('frontend.marketplace.showathleteofowner')->with(['celebrities'=>$athlete, 'user_info'=>$userInfo, 'account_wallet'=>$wallet_id, 'provider'=>$provider, 'contractAddress'=>$contractAddress]);
    }
    public function searchPlayers() {
        header('Access-Control-Allow-Origin:*');
        $filter = request()->get('search');
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }
        $ret = Common::searchAthletes($filter);
        return view('frontend.marketplace')->with(['athletes'=>$ret, 'provider'=>$provider, 'contractAddress'=>$contractAddress]);
    }
}
