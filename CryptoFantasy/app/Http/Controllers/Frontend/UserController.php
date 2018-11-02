<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Celebrity;
use App\Models\Common;
use App\Models\Message;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Support\Facades\Crypt;
use PHPUnit\Runner\Exception;
use App\Models\BaseEthProvider;
use App\Events\MessagePosted;
class UserController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }
    public function index() {
        $user = \Auth::user();
        $user->wallet_id = base64_decode($user->wallet_id);
        $user->privatekey = base64_decode($user->private_key);
        $providerInfo = Common::getEthProvider();
        return view('frontend.useraccount')->with(['user'=>$user]);
    }
    public function changeUsername() {
        $user = \Auth::user();
        User::where('_id', $user->id)->update(['username'=> request()->get('username')]);
        return redirect()->route('account');
    }

    public function getUserAssetbalance() {
        try{
            $user = \Auth::user();
            $wallet_address = $user->wallet_id;

            $contractCount = Common::getAthleteInfoOfOwner($user->id);
            return response()->json(['balance'=>255, 'wallet_id'=>$wallet_address, 'contractcount'=>count($contractCount)]);
        }
        catch(Exception $exp) {
            return response()->json('fail');
        }
    }

    public function changeAthletePrice() {
        $athlete_id = request()->get('athlete_id');
        $price = request()->get('price');
        $model = new Celebrity();
        $model->where('_id', $athlete_id)->update(['price'=>$price]);

        return redirect()->route('myathlete', [$athlete_id]);
    }

    public function getAuthUserInfo() {
        $user = \Auth::user();
        $user->wallet_id = Crypt::decrypt($user->wallet_id);
        return response()->json($user->toArray());
    }
    public function withdraw() {
        $user = \Auth::user();
        $post_req['from_address'] = Crypt::decrypt($user->wallet_id);
        $post_req['from_privatekey'] = Crypt::decrypt($user->private_key);
        $post_req['value'] = request()->get('withdraw_amount');
        $post_req['to_address'] = request()->get('withdraw_address');
        $post_req['gasPrice'] = config('app.gasPrice')."000000000";
        $post_req['gas'] = config('app.gasLimit');

        $tmp = array();
        foreach( $post_req as $key=>$val ) {
            $tmp[] = $key.'='.$val;
        }
        $get_param = implode('&', $tmp);

        $ch = curl_init();
        $blockchainServer = config('app.blockchainserver');
        curl_setopt($ch, CURLOPT_URL, $blockchainServer.'/sendether?'.$get_param);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $result = json_decode(curl_exec($ch));
        dd($result);
        return redirect()->route('account');
    }

    public function showDetailsForAthlete($athlete_id) {
        $model = new BaseEthProvider();
        $data = $model->all()->first();
        $provider = $data['provider'];
        $athlete = Common::getAthleteInfo($athlete_id);
        $owner_history = Common::getOwnerHistoryOfAthlete($athlete_id);

        if ( $provider == 'test' ) {
            $contractAddress = $data['test_contract_address'];
        }
        else {
            $contractAddress = $data['main_contract_address'];
        }
        return view('frontend.myshowathlete')->with(['athlete'=>$athlete, 'owner_history'=>$owner_history, 'provider'=>$provider, 'contractAddress'=>$contractAddress]);
    }
    public function checkOwnerOfAthlete($athleteId) {
        try{
            $user_id = \Auth::user()->id;
            $data = app(Celebrity::class)->where('_id', $athleteId)->first()->toArray();
            if ( $data['owner_id'] == $user_id ) return 'false';
            return 'true';
        }
        catch(Exception $exp) {
            return redirect()->route('login');
        }

    }
    public function createMessage() {
        header('Access-Control-Allow-Origin:*');
        $messageModel = new Message();
        $user = \Auth::user();
        $messageModel->message = request()->get('message');
        $messageModel->user_id = $user->id;
        $messageModel->save();
        broadcast(new MessagePosted($messageModel, $user))->toOthers();
        return response()->json(['status'=>'OK']);
    }
    public function getMessages() {
        $model = new Message();
        $messages = $model->orderBy('created_at', 'desc')->take(100)->get();
        $ret_data = array();
        if ($messages) {
            $datas = $messages->toArray();
            foreach( $datas as $data ) {
                $userInfo = Common::getUserInfoFromId($data['user_id']);
                $data['user_name'] = $userInfo['username'];
                $ret_data[] = $data;
            }
        }
        return response()->json(array_reverse($ret_data));
    }
    public function uploadAthletePhoto() {
        date_default_timezone_set('UTC');
        $athleteId = request()->get('athleteId');
        $athletePhoto = $_FILES['athlete_photo'];
        $path = 'upload/athlete/avatar';
        $path_parts = pathinfo($_FILES["athlete_photo"]["name"]);
        $ext = $path_parts['extension'];
        $new_athletephoto_name = $athleteId.".".$ext;
        $filePath = $path .'/'.$new_athletephoto_name;
        $tmp = $_FILES['athlete_photo']['tmp_name'];
        if(move_uploaded_file($tmp, $filePath)) {
            $athleteData = app(Celebrity::class)->where('_id', $athleteId)->first();
            $athleteData->avatar_image_name = $new_athletephoto_name;
            $athleteData->save();
//            return redirect('myathlete/'.$athleteId);
        }
        return redirect()->route('dashboard');
    }
}
