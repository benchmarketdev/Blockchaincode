<?php

namespace App\Http\Controllers\Backend;

use App\Models\Common;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class TransactionController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }
    public function index() {
        $trade_data = Common::getTransactionData();
        return view('backend.transaction')->with(['transaction_data'=>$trade_data]);
    }
}
