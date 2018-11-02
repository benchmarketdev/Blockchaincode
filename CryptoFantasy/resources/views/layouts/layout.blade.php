<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Centra.Tech') }}</title>

    <!-- Styles -->

    <!-- The fav icon -->
    <link rel="shortcut icon" href="images/centra-logo.png">

    <style>
        .form-control{
            background: transparent;
        }
    </style>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <!-- <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script> -->
    <!-- <script src="https://maps.googleapis.com/maps/api/js?libraries=places&amp;key=AIzaSyCGyEhcN3EHQtgq5aewE_elp6mQyrbuWyA&amp;language=en"></script> -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link href="{{ asset('images/centra-logo.png') }}" rel="icon" />
    <style>
      .container{
        width:100%;
      }
      .container-body{
        width:100%;
        margin:0px;
        padding:0px;
        margin-top:-20px;
      }
      .a-sub-menu {
        border-left: 1px #999 solid;
        margin-left:20px;
      }
      body{
        background-color: #082648;
        background-image: url({{ URL::asset('./assets/images/background.jpg') }});
        background-repeat: no-repeat;
        background-size: cover;
      }
      a{
        cursor:pointer;
      }
      .div-panel-heading {
        height: 24px;
        font-size: 16px;
        font-weight: bolder;
        color: white;
        background: rgba(220,220,255,0.3);
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
      }
      .div-panel {
        height: 100%;
        padding: 1px;
        overflow: hidden;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        border: 1px solid #EEEEEE;
        margin: 5px;
        min-width:220px;
      }
      .full-height {
        height: 100%;
      }
      .i-green {
        color:#78FF8A;
      }
      .i-red {
        color: #FF5962;
      }
      .div-white {
        color: white;
      }
      .a_board {
        padding: 10px 10px!important;
      }
      .active {
        background: transparent!important;
        border:none!important;
        border-bottom: 2px solid white;
        /*color:white;*/
      }
      .full-rect {
        width: 100%;
      }
      .trans-element {
        background: rgba(255,255,255,0);
        color: white;
      }
      .text-right{
        text-align: right;
        padding-right: 10px;
      }
      .div-padding10{
        padding:10px;
      }
      .div-padding8{
        padding:8px!important;
      }
    </style>
</head>
<body>
    <div id="app">
        <nav class="navbar navbar-default navbar-static-top">
            <div class="container">
                <div class="navbar-header">

                    <!-- Collapsed Hamburger -->
                    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#app-navbar-collapse">
                        <span class="sr-only">Toggle Navigation</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>

                    <!-- Branding Image -->
                    @if ( Auth::guest() )
                      <a class="navbar-brand" href="{{ url('/') }}">
                          {{ config('app.name', 'Laravel') }}
                      </a>
                    @else
                    <ul class="nav navbar-nav">
                      <li class="dropdown">
                        <a class="dropdown-toggle" data-toggle="dropdown">
                        <label  id="a_point" ></label>
                        <span class="caret"></span>
                      </a>
                        <ul class="dropdown-menu">
                          <li><strong>&nbsp;&nbsp;&nbsp;BITCOIN</strong></li>
                          <li>
                            <a  class="a-sub-menu" id="a_btc_usd">
                              <div id="btc_usd" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>BTC/USD</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-dollar"></i><label id="lbl_btc_usd">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_btc_usd_rate">6.67%</label><i class="fa fa-caret-up"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a  class="a-sub-menu" id="a_btc_eur">
                              <div id="btc_eur" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>BTC/EUR</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-eur"></i><label id="lbl_btc_eur">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_btc_eur_rate">6.67%</label><i class="fa fa-caret-up"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a  class="a-sub-menu" id="a_btc_gbp">
                              <div id="btc_gbp" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>BTC/GBP</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-gbp"></i><label id="lbl_btc_gbp">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_btc_gbp_rate">6.67%</label><i class="fa fa-caret-down"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li><strong>&nbsp;&nbsp;&nbsp;ETHER</strong></li>
                          <li>
                            <a  class="a-sub-menu" id="a_eth_usd">
                              <div id="eth_usd" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>ETH/USD</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-dollar"></i><label id="lbl_eth_usd">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_eth_usd_rate">6.67%</label><i class="fa fa-caret-up"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a  class="a-sub-menu" id="a_eth_btc">
                              <div id="eth_eur" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>ETH/BTC</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-btc"></i><label id="lbl_eth_eur">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_eth_eur_rate">6.67%</label><i class="fa fa-caret-up"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a  class="a-sub-menu" id="a_eth_eur">
                              <div id="eth_gbp" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>ETH/EUR</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-eur"></i><label id="lbl_eth_gbp">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_eth_gbp_rate">6.67%</label><i class="fa fa-caret-down"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li><strong>&nbsp;&nbsp;&nbsp;LITECOIN</strong></li>
                          <li>
                            <a  class="a-sub-menu" id="a_ltc_usd">
                              <div id="ltc_usd" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>LTC/USD</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-dollar"></i><label id="lbl_ltc_usd">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_ltc_usd_rate">6.67%</label><i class="fa fa-caret-up"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a  class="a-sub-menu" id="a_ltc_btc">
                              <div id="ltc_eur" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>LTC/BTC</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-btc"></i><label id="lbl_ltc_eur">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_ltc_eur_rate">6.67%</label><i class="fa fa-caret-up"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a  class="a-sub-menu" id="a_ltc_eur">
                              <div id="ltc_gbp" style="width:240px;">
                                <div class="row">
                                  <div class="col-md-4 text-center"><strong>LTC/EUR</strong></div>
                                  <div class="col-md-4 text-center"><i class="fa fa-eur"></i><label id="lbl_ltc_gbp">123123</label></div>
                                  <div class="col-md-4 text-right" style="color:green"><label id="lbl_ltc_gbp_rate">6.67%</label><i class="fa fa-caret-down"></i></div>
                                </div>
                              </div>
                            </a>
                          </li>
                        </ul>
                      </li>
                      <li><a  id="a_price" cur_price=''>Home</a></li>
                      <li><a  id="a_24hr_volume_rate">-5.26%</a></li>
                      <li><a  id="a_volume_amount">Page 3</a></li>
                    </ul>
                    @endif
                </div>

                <div class="collapse navbar-collapse" id="app-navbar-collapse">
                    <!-- Left Side Of Navbar -->
                    <ul class="nav navbar-nav">
                        &nbsp;
                    </ul>

                    <!-- Right Side Of Navbar -->
                    <ul class="nav navbar-nav navbar-right">
                        <!-- Authentication Links -->
                        @if (Auth::guest())
                            <li><a href="{{ route('login') }}">Login</a></li>
                            <li><a href="{{ route('register') }}">Register</a></li>
                        @else
                            <li class="dropdown">
                                <a  class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">
                                    {{ Auth::user()->name }} <span class="caret"></span>
                                </a>

                                <ul class="dropdown-menu" role="menu">
                                    <li>
                                        <a href="{{ route('logout') }}"
                                            onclick="event.preventDefault();
                                                     document.getElementById('logout-form').submit();">
                                            Logout
                                        </a>

                                        <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                                            <!-- {{ csrf_field() }} -->
                                        </form>
                                    </li>
                                </ul>
                            </li>
                        @endif
                    </ul>
                </div>
            </div>
        </nav>

        @yield('content')
    </div>


</body>
</html>
