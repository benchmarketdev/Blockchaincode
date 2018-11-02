<?php

namespace App\Http\Controllers\Auth;

use App\User;
use App\Http\Controllers\Controller;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Auth\RegistersUsers;
use App\Models\BaseEthProvider;

class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    use RegistersUsers;

    /**
     * Where to redirect users after registration.
     *
     * @var string
     */
    protected $redirectTo = '/home';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest');
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @param  array  $data
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        return Validator::make($data, [
            'username' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array  $data
     * @return \App\User
     */
    protected function create(array $data)
    {
//        $wallet_info = $this->getNewWalletInfo();
        $address = strtolower($data['address']);
        $privatekey = $data['privatekey'];
        $encrypted_address = base64_encode($address);
        $encrypted_privatekey = base64_encode($privatekey);
        return User::create([
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'email_verfication' => 0,
            'user_role' => 0,
            'was_bought' => 0,
            'wallet_id' => $encrypted_address,
            'private_key' => $encrypted_privatekey
        ]);
    }

    private function getNewWalletInfo() {
        $model = new BaseEthProvider();
        $data = $model->all()->first()->toArray();
        $ch = curl_init();
        $blockchainServer = $data['blockchainserver'];
        curl_setopt($ch, CURLOPT_URL, $blockchainServer.'/newaddress');
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $wallet_info = json_decode(curl_exec($ch));
        return $wallet_info;
    }



//    protected function register(Request $request) {
//        $input = $request->all();
//        $validator = $this->validator($input);
//
//    }
}
