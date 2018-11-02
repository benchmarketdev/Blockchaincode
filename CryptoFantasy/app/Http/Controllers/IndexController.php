<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;


class IndexController extends Controller
{
    //
    public function index() {
        $admin_user = config('app.sys_admin');
        if ( is_null($admin_user) ) {
            return view('auth.registermanager');
        }
        else {
            return redirect()->route('home');
        }
        //return view('welcome');
    }
}
