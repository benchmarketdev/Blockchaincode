<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Common;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\BaseEthProvider;

class DashboardController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }

    public function index() {
        $user = \Auth::user();
        $athletes = Common::getAthleteInfoOfOwner($user->id);
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }
        return view('frontend.dashboard')->with(['athletes'=>$athletes, 'provider'=>$provider, 'contractAddress'=>$contractAddress]);
    }
    public function transactionview() {
        $user = \Auth::user();
        $transaction_data = Common::getTransactionData($user->id);
        return view('frontend.transaction')->with(['transaction_data'=>$transaction_data]);
    }
}
