<?php

namespace App\Http\Controllers\Backend;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\User;
class MemberController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }
    public function index(){
        $data = User::where('user_role',0)->get()->toArray();
//        dd($data);
        return view('backend.member')->with(['user_list'=>$data]);
    }
}
