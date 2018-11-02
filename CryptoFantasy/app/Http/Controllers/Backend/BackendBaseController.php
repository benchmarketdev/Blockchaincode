<?php

namespace App\Http\Controllers\Backend;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BackendBaseController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }
    public function index() {
        return view('backend.base.editbasedata');
    }
}
