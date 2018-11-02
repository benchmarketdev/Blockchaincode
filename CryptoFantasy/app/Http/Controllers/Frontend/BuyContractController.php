<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Celebrity;
use App\Models\Common;
use App\Models\Purchase;
use App\Models\Sold;
use App\Models\TransactionHistory;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\BaseEthProvider;
use Illuminate\Support\Facades\Crypt;

class BuyContractController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }

    public function index($athlete_id) {
        $user = \Auth::user();
        $athlete_data = Common::getAthleteInfo($athlete_id);

        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }

        $account_wallet_id = base64_decode($user->wallet_id);
        $account_private_key = base64_decode($user->private_key);
        return view('frontend.buycontract')->with(['athlete'=>$athlete_data, 'provider'=>$provider, 'contractAddress'=>$contractAddress, 'account_wallet_id'=>$account_wallet_id, 'account_private_key'=>$account_private_key]);
    }

    public function buyContract($athlete_id) {
        $user = \Auth::user();
        $price = request()->get('price');
//        $request['value'] = $price;
//        $request['gasPrice'] = config('app.gasPrice')."0000000000";
//        $request['gas'] = config('app.gasLimit');
//        $request['tokenId'] = request()->get('tokenId');
//        $request['from'] = Crypt::decrypt($user->wallet_id);
//        $request['fromPrivateKey'] = Crypt::decrypt($user->private_key);

//        $this->connect($request);

        $user->was_bought = 1;
        $user->save();


        $athleteModel = new Celebrity();

        $athlete_record = $athleteModel->where('_id', $athlete_id)->first();
        $athleteData = $athlete_record->toArray();

        $seller_id = $athleteData['owner_id'];
        $sellerInfo = Common::getUserInfoFromId($seller_id);
        $buyerInfo = $user;
        $athleteInfo = Common::getAthleteInfo($athlete_id);

        if ( $user->id == $seller_id )
            return redirect()->route('dashboard');

        $transactionModel = new TransactionHistory();
        $buyer_id = $user->id;
        $price *= 1;
        $site_fee = $athleteData['site_fee']*$price/100;
        $actual_fee = $athleteData['send_fee']*$price/100;

        $athlete_record->owner_id = $buyer_id;
        $athlete_record->price = $price*2;
        $athlete_record->purchase_price = $price*1;
        $athlete_record->transactions = $athlete_record->transactions+1;
        $athlete_record->save();

//        $purchaseModel = new Purchase();
//        $purchaseModel->athlete_id = $athlete_id;
//        $purchaseModel->owner_id = $buyer_id;
//        $purchaseModel->price = $price;
//        $purchaseModel->save();
//
//        $seller_data = $purchaseModel->where('owner_id', $seller_id)->where('athlete_id', $athlete_id)->first()->toArray();
//        $purchaseModel->where('owner_id', $seller_id)->where('athlete_id', $athlete_id)->delete();
//
//        $soldModel = new Sold();
//        $soldModel->athlete_id = $seller_data['athlete_id'];
//        $soldModel->owner_id = $seller_data['owner_id'];
//        $soldModel->purchase_price = $seller_data['price'];
//        $soldModel->sold_price = $price;
//        $soldModel->save();

        $transactionModel->athlete_id = $athlete_id;
        $transactionModel->seller = $seller_id;
        $transactionModel->buyer = $buyer_id;
        $transactionModel->price = $price;
        $transactionModel->purchase_price = $athleteData['purchase_price'];
        $transactionModel->site_fee = $site_fee;
        $transactionModel->actual_fee = $actual_fee;
        $transactionModel->save();

        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        if ( $provider == 'test' ) {
            $contractAddress = 'https://ropsten.etherscan.io/address/'.$data['test_contract_address'];
        }
        else {
            $contractAddress = 'https://etherscan.io/address/'.$data['main_contract_address'];
        }

        $to_email = \Auth::user()->email;
        $to_fullname = \Auth::user()->username;

        $subject = "CryptoFantasy";
        $from_email = "manager@fantasy.com";
        $from_fullname = "Crypto Fantasy Manager";
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "To: $to_fullname <$to_email>\r\n";
        $headers .= "From: $from_fullname <$from_email>\r\n";
        $headers .= "Reply-To: {$from_email}" . "\r\n";

        $message = "<!DOCTYPE html>
                        <html lang=\"en\">
                        <head>
                            <meta charset=\"UTF-8\">
                            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
                            <meta http-equiv=\"X-UA-Compatible\" content=\"ie=edge\">
                            <title>Buy Alarm</title>
                        </head>
                        <body>
                            <h2>Hi {$to_fullname},</h2>
                            <h3>You just bought following athlete from {$sellerInfo['username']}.</h3>
                            <h3>Sport Type: {$athleteInfo['type_name']}.</h3>
                            <h3>Team Name: {$athleteInfo['team_name']}.</h3>
                            <h3>player Name: {$athleteInfo['player_name']}.</h3>
                            <h3>Price: {$athleteInfo['price']}.</h3>
                            <h3>Date:". date('Y-m-d H:i:s').".</h3>
                            <h3>Team Crypto Fantasy.</h3>
                            <h3>You can check to click <a href='{$contractAddress}' target='_blank' >this link</a>.</h3>
                        </body>
                    </html>";

//        if ( $message != '' )
//            @mail($to_email, $subject, $message, $headers);


        $to_email = $sellerInfo['email'];
        $to_fullname = $sellerInfo['username'];

        $subject = "CryptoFantasy";
        $from_email = "manager@fantasy.com";
        $from_fullname = "Crypto Fantasy Manager";
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "To: $to_fullname <$to_email>\r\n";
        $headers .= "From: $from_fullname <$from_email>\r\n";
        $headers .= "Reply-To: {$from_email}" . "\r\n";

        $message = "<!DOCTYPE html>
                        <html lang=\"en\">
                        <head>
                            <meta charset=\"UTF-8\">
                            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
                            <meta http-equiv=\"X-UA-Compatible\" content=\"ie=edge\">
                            <title>Buy Alarm</title>
                        </head>
                        <body>
                            <h2>Hi {$to_fullname},</h2>
                            <h3>You just sold your athlete to {$buyerInfo['username']}.</h3>
                            <h3>Sport Type: {$athleteInfo['type_name']}.</h3>
                            <h3>Team Name: {$athleteInfo['team_name']}.</h3>
                            <h3>player Name: {$athleteInfo['player_name']}.</h3>
                            <h3>Price: {$athleteInfo['price']}.</h3>
                            <h3>Price: {$athleteInfo['price']}.</h3>
                            <h3>Date:". date('Y-m-d H:i:s').".</h3>
                            <h3>Team Crypto Fantasy.</h3>
                            <h3>You can check to click <a href='{$contractAddress}' target='_blank' >this link</a>.</h3>
                        </body>
                    </html>";

//        if ( $message != '' )
//            @mail($to_email, $subject, $message, $headers);

        return 'ok';
//        return redirect()->route('dashboard');
//dd($user, $price, $athlete_id);
    }


    public function setAthleteStatusToPending($athleteId) {
        $athleteModel = new Celebrity();
        $athlete_record = $athleteModel->where('_id', $athleteId)->first();
        $athlete_record->owner_id='pending';
        $athlete_record->save();
    }

    public function showPendingForm($athlete_id) {

        $user = \Auth::user();
        $athlete_data = Common::getAthleteInfo($athlete_id);

        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }
        $athlete_data['owner_name'] = 'pending';
        $account_wallet_id = base64_decode($user->wallet_id);
        $account_private_key = base64_decode($user->private_key);
        return view('frontend.pending')->with(['athlete'=>$athlete_data, 'provider'=>$provider, 'athlete_id'=>$athlete_id, 'contractAddress'=>$contractAddress, 'account_wallet_id'=>$account_wallet_id, 'account_private_key'=>$account_private_key]);

    }
    function connect($body){
        $ch = curl_init();
        $headers = array(
            'Accept: application/json',
            'Content-Type: application/json',

        );
        $query = '';
        $arr = [];
        foreach($body as $key=>$value) {
            $arr[] = $key.'='.$value;
        }
        $query = implode('&', $arr);
        $blockchainServer = config('app.blockchainserver');
        curl_setopt($ch, CURLOPT_URL, $blockchainServer.'/purchase?'.$query);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $authToken = curl_exec($ch);

        return $authToken;
    }
}
