<?php

namespace App\Http\Controllers\Backend;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\BaseEthProvider;

class EthProviderController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }
    public function index() {
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        if ( $data ) $data = $data->toArray();
        else{
            $data['provider'] = 'test';
            $data['main_provider'] = '';
            $data['test_provider'] = '';
            $data['main_contract_address'] = '';
            $data['main_admin_address'] = '';
            $data['main_admin_privatekey'] = '';
            $data['test_contract_address'] = '';
            $data['test_admin_address'] = '';
            $data['test_admin_privatekey'] = '';
        }
        return view('backend.ethprovider')->with(['provider'=>$data]);
    }
    public function storeProviderInfo() {
        $provider = request()->get('provider');
        $main_provider = request()->get('main_provider');
        $test_provider = request()->get('test_provider');
        $main_contract_address = request()->get('main_contract_address');
        $main_admin_address = request()->get('main_admin_address');
        $main_admin_privatekey = request()->get('main_admin_privatekey');
        $test_contract_address = request()->get('test_contract_address');
        $test_admin_address = request()->get('test_admin_address');
        $test_admin_privatekey = request()->get('test_admin_privatekey');
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $data->provider = $provider;
        $data->main_provider = $main_provider;
        $data->test_provider = $test_provider;
        $data->main_contract_address = $main_contract_address;
        $data->main_admin_address = $main_admin_address;
        $data->main_admin_privatekey = $main_admin_privatekey;
        $data->test_contract_address = $test_contract_address;
        $data->test_admin_address = $test_admin_address;
        $data->test_admin_privatekey = $test_admin_privatekey;
        $data->save();

        return redirect()->route('show.provider.form');
    }
}
