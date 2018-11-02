<?php

namespace App\Http\Controllers\Frontend;

use Illuminate\Http\Request;

class AuthMarketplaceController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }

    public function index() {

    }

}
