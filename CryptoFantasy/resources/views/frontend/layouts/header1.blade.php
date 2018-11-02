<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Laravel') }}</title>

    <!-- Styles -->
    <link href="http://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&subset=all" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/font-awesome/css/font-awesome.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/simple-line-icons/simple-line-icons.min.css') }}" rel="stylesheet" type="text/css" />

    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link href="{{ asset('css/frontend/home.css') }}" rel="stylesheet">
    <script src="{{ asset('theme/bower_components/jquery/jquery.min.js') }}"></script>

    <style>
        body{
            font-family: monospace, sans-serif;
        }
        .dropdown-menu {
            min-width: 200px;
        }
        .dropdown-menu.columns-2 {
            min-width: 400px;
        }
        .dropdown-menu.columns-3 {
            min-width: 600px;
        }
        .dropdown-menu li a {
            padding: 5px 15px;
            font-weight: 300;
        }
        .multi-column-dropdown {
            list-style: none;
            margin: 0px;
            padding: 0px;
        }
        .multi-column-dropdown li a {
            display: block;
            clear: both;
            line-height: 1.428571429;
            color: #333;
            white-space: normal;
        }
        .multi-column-dropdown li a:hover {
            text-decoration: none;
            color: #262626;
            background-color: #999;
        }

        @media (max-width: 767px) {
            .dropdown-menu.multi-column {
                min-width: 240px !important;
                overflow-x: hidden;
            }
        }
        .navbar-default .navbar-nav>.open>a, .navbar-default .navbar-nav>.open>a:focus, .navbar-default .navbar-nav>.open>a:hover{
            background: transparent;
        }
        .multi-column-dropdown li a {
            color: #FFF;
        }
        .dropdown-menu>li>a {
            color: #c2d7e6;
            font-weight:bold;
        }
        .dropdown-menu>li>a:hover {
            color: #c2d7e6;
            background: #1f3d56;
            font-weight:bold;
        }
        .dropdown-menu {
            background: #12202f;
        }
        .asset-balance {
            font-family: inherit;
            font-size: 18px;
            color: gold;
            padding-top: 15px;
            padding-left: 15px;
            line-height:1;
        }
    </style>
</head>
<body>
<div id="app" class="app-body">
    <nav class="navbar navbar-default navbar-static-top" style="border-width:0;margin-bottom:0;">
        <div class="container-fulid header padding0" style="padding-right:0;">
            <div class="navbar-header">

                <!-- Collapsed Hamburger -->
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#app-navbar-collapse" aria-expanded="false" style="border:none;">
                    <span class="sr-only">Toggle Navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>

                <!-- Branding Image -->
                <a class="navbar-brand" href="{{ url('/') }}">
                    {{ config('app.name', 'Laravel') }}
                </a>

            </div>

            <div class="collapse navbar-collapse" id="app-navbar-collapse">
                <!-- Left Side Of Navbar -->
                <ul class="nav navbar-nav">
                    <li class="dropdown"  id="marketplace_dropdownmenu">

                    </li>
                </ul>

                <!-- Right Side Of Navbar -->
                <ul class="nav navbar-nav navbar-right" style="padding-right:20px;">

                    <!-- Authentication Links -->
                    @guest
                    <li><a href="{{ route('login') }}">SignIn</a></li>
                    <li><a href="{{ route('register') }}">SignUp</a></li>
                    @else
                        <li><label class="asset-balance" id="balance"></label></li>
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false" aria-haspopup="true">
                                {{ Auth::user()->username }} <span class="caret"></span>
                            </a>

                            <ul class="dropdown-menu">
                                <li>
                                    <a href="{{ route('dashboard') }}" >Dashboard</a>
                                </li>
                                <li>
                                    <a href="{{ route('account') }}" >My Account</a>
                                </li>
                                <li>
                                    <a href="{{ route('logout') }}"
                                       onclick="event.preventDefault();
                                                     document.getElementById('logout-form').submit();">
                                        Logout
                                    </a>

                                    <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                                        {{ csrf_field() }}
                                    </form>
                                </li>
                            </ul>
                        </li>
                        @endguest
                </ul>
            </div>
        </div>
    </nav>

    <div class="crypto-container">
        <div class="col-xs-12 col-md-12 crypto-celebrity-container">
            <div class="container-fluid marketplace-container">
                @yield('content')
            </div>
        </div>
    </div>
</div>





<!-- Scripts -->
<script src="{{ asset('js/app.js') }}"></script>
<script>
    $(document).ready(function(){
        doOnResizeAppBody();
        $(window).resize(function(){
            doOnResizeAppBody();
        });

        $.get('/getmarketplacemenu', function(tree_data){
            var marketplaceHTML = '<a href="#" class="dropdown-toggle" data-toggle="dropdown">Marketplace</a>';
            if ( tree_data.length>0 ){
                marketplaceHTML += '<ul class="dropdown-menu multi-column columns-3 marketplace-ul">\
                        <div class="row">';
                for(i in tree_data) {
                    type = tree_data[i];
                    marketplaceHTML += '<div class="col-xs-12 col-sm-4">\
                            <label>'+ type.type_name+'</label>';
                    if (type.team_data) {
                        marketplaceHTML += '<ul class="multi-column-dropdown">';
                        for(j in type.team_data) {
                            var team = type.team_data[j];
                            marketplaceHTML += '<li><a href="/marketplace/'+team._id+'">'+ team.team_name+'</a></li>';
                        }
                        marketplaceHTML += '</ul>';
                    }
                    marketplaceHTML += '</div>';
                }
                marketplaceHTML += '</div>\
                        </ul>';
            }
            $('#marketplace_dropdownmenu').html(marketplaceHTML);
            console.log(tree_data);
        });

        $.get('/accountbalance', function(resp) {
            if ( resp != 'fail' )
                $('#balance').html('Contracts:'+resp.contractcount);
        });
    });

    doOnResizeAppBody = function() {
        $('.app-body').css('width', $(window)[0].innerWidth);
        $('.app-body').css('height', $(window)[0].innerHeight);
    }

</script>
</body>
</html>
