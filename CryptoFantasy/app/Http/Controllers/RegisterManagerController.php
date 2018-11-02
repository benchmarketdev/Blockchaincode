<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\User;

class RegisterManagerController extends Controller
{
    //
    public function index() {
        return view('auth.registermanager');
    }
    public function registerManager() {
        $username = request()->get('username');
        $email = request()->get('email');
        $password = request()->get('password');

        $user = User::create([
            'username' => $username,
            'email' => $email,
            'password' => bcrypt($password),
            'email_verfication' => 1,
            'user_role' => 1
        ]);

        $admin_data = 'SYS_ADMIN='.$username;
        $env_file = '.env';
        $handle = fopen(base_path($env_file), 'a') or die('Cannot open file:  '.$env_file);

        fwrite($handle, $admin_data);
        fclose($handle);

        return redirect()->route('home');
    }
}
