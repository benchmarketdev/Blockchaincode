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

    <link rel="shortcut icon" href="{{ asset('./images/icon/logo.png') }}">
    <style>
        body{
            font-family: monospace, sans-serif;
        }

    </style>
    <script src="{{ asset('./js/Blockchain.js') }}" ></script>
</head>
<style>
    @media(max-width: 767px){
        .navbar-nav {
            margin: 0px -15px;
        }
        .navbar-nav a {
            background-color: black;
        }
        .navbar-default .navbar-nav>.open>a, .navbar-default .navbar-nav>.open>a:focus, .navbar-default .navbar-nav>.open>a:hover {
            background: rgb(25,25,25)!important;
        }
        .navbar-default .navbar-nav > li > a:hover, .navbar-default .navbar-nav > li > a:focus {
            color: #333;
            background-color: rgb(25,25,25)!important;
        }
        .navbar-default .navbar-toggle:hover, .navbar-default .navbar-toggle:focus {
            background-color: transparent;
        }
        .dropdown-menu {
            padding: 0px;
            border: 1px solid #ffffff77;
        }
    }
    /* width */
    ::-webkit-scrollbar {
        width: 5px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: #f1f1f133;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: #888;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: #555;
    }

    .black-background {
        background: #000!important;
    }

    .animate-in {
        -webkit-animation: fadeIn .5s ease-in;
        animation: fadeIn .5s ease-in;
    }
    .animate-out {
        -webkit-transition: opacity .5s;
        transition: opacity .5s;
        opacity: 0;
    }
    @-webkit-keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    /*************************************   Megamenu Start   ******************************************/
    .dropdown-content {
        display: none;
        position: absolute;
        background-color: #031b2d;
        width: 660px;
        left: 0;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
    }
    .dropdown:hover .dropdown-content {
        display: block;
    }
    /* Create three equal columns that floats next to each other */
    .column {
        float: left;
        width: 33.33%;
        padding: 5px 10px;
        background-color: #031b2d;
    }
    .column a {
        float: none;
        color: #80c3fa;
        padding: 10px;
        text-decoration: none;
        display: block;
        text-align: left;
    }
    .column a:hover {
        background-color: #02121f;
    }
    /* Clear floats after the columns */
    .menu-row:after {
        content: "";
        display: table;
        clear: both;
    }
    .wide-lg {
        width: 100%;
    }
    .nav-a {
    }
    .nav-a:hover {
        color: gold;
    }
    /* Responsive layout - makes the three columns stack on top of each other instead of next to each other */
    @media screen and (max-width: 600px) {
        .column {
            width: 100%;
            height: auto;
        }
        .dropdown-content {
            width: 100%;
            height: 500px;
            overflow: auto;
        }
        .nav-a {
            background-color: #031b2d!important;
        }
    }

    .sidenav {
        height: 100%;
        width: 0;
        position: fixed;
        z-index: 3;
        top: 0;
        left: 0;
        background-color: #111;
        overflow-x: hidden;
        transition: 0.5s;
        /*padding-top: 60px;*/
        /*display: none;*/
    }

    .sidenav a {
        /*padding: 8px 8px 8px 32px;*/
        text-decoration: none;
        font-size: 14px;
        color: #818181;
        display: block;
        transition: 0.3s;
    }

    .sidenav a:hover {
        color: #f1f1f1;
    }

    .sidenav .closebtn {
        position: absolute;
        top: -5px;
        right: 10px;
        /*top: 0;*/
        /*right: 25px;*/
        font-size: 36px;
        margin-left: 50px;
    }


    /** {*/
    /*!* 		margin: 0; *!*/
    /*padding: 0;*/
    /*font-size: 100%;*/
    /*font: inherit;*/
    /*vertical-align: baseline*/
    /*}*/
    /*body {*/
    /*line-height: 1;*/
    /*font: 100% "roboto", "Trebuchet MS", sans-serif;*/
    /*}*/
    header *{
        margin: 0;
        padding: 0;
        font-size: 14px;
        font-family: Montserrat-Light;
        vertical-align: baseline
    }
    a {
        text-decoration: none;
    }
    header {
        /*margin: 100px auto;*/
        /*max-width: 22.5rem;*/
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
    }
    .nav a, .nav label {
        display: block;
        padding: .85rem;
        color: white;
        background-color: #151515;
        box-shadow: inset 0 -1px #1d1d1d;
        -webkit-transition: all .25s ease-in;
        transition: all .25s ease-in;
    }
    .nav li
    {
        list-style-type: none;
    }
    .nav ul a:hover
    {
        color:#000;
        background: #ccc;
    }
    .nav ul ul
    {
        display: none;
    }
    .nav li.active>ul
    {
        display: block;
    }
    .nav ul ul a
    {
        padding-left: 1rem;
        background: #222;
        box-shadow: inset 0 -1px #333;
    }
    .nav ul ul ul a
    {
        padding-left: 2rem;
        background: #333;
        box-shadow: inset 0 -1px #444;
    }
    .nav ul ul ul ul a
    {
        padding-left: 3rem;
        background: #444;
        box-shadow: inset 0 -1px #555;
    }
    .nav li.active>a+ul
    {
        /* reset the height when checkbox is checked */
        max-height: 1000px;
    }
    a>span
    {
        float: right;
        -webkit-transition: -webkit-transform .65s ease;
        transition: transform .65s ease;
    }
    .nav li.active>a>span
    {
        -webkit-transform: rotate(90deg);
        -ms-transform: rotate(90deg);
        transform: rotate(90deg);
    }
    .group-list{
        height: 300px;
        overflow-y: auto;
    }

    @media (max-width: 767px) {
        .sidenav {
            display: block;
        }
        .sidenav .closebtn {
            top: -5px;
            right: 5px;
        }
        /*.sidenav {padding-top: 15px;}*/
        .sidenav a {font-size: 14px;}
        input[type=text]{
            width: 280px;
        }
        .navbar-brand {
            display: none;
        }
        #bs-example-navbar-collapse-1 {
            display: none;
        }
        .navbar-header button {
            display: none;
        }
    }
    #bs-example-navbar-collapse-1 {
        display: none;
    }
    /*************************************   Megamenu End     ******************************************/
</style>
<script>var blockchainServer='{{ config('app.blockchainserver') }}'</script>
<script>
    Athlete.init();
    var menu_data = <?php echo json_encode($menu_data); ?>;
</script>
<body>
<div id="alertModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title" id="alertmodal_title">Modal Header</h4>
            </div>
            <div class="modal-body" id="alertmodal_body">
                <p>Some text in the modal.</p>
            </div>
            <div class="modal-footer">
                <button type="button" id="alertmodal_footer_cancel" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
<div id="app" class="app-body">
    <nav class="navbar navbar-default navbar-laravel">
        <div class="container-fluid">
            <!-- Brand and toggle get grouped for better mobile display -->
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <span style="color:white;font-size:30px;cursor:pointer;float:left;margin-left: 5px;" id="div_open">&#9776; </span>
                <a class="navbar-brand" href="{{ url('/') }}" style="margin-left:3px;">
                    <img src="{{ asset('./images/icon/logo.png') }}" class="logo-icon" />
                    <span class="logo-title">CRYPTO FANTASY</span>
                </a>
            </div>
            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="nav navbar-nav" id="dropdown_marketplace_menu">

                </ul>
                <ul class="nav navbar-nav navbar-right">
                    @guest
                    <li><a href="{{ route('login') }}">SignIn</a></li>
                    <li><a href="{{ route('register') }}">SignUp</a></li>
                    @else
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                                {{ Auth::user()->username }} <span class="caret"></span>
                            </a>
                            <!-- Authentication Links -->
                            <ul class="dropdown-menu">
                                @if ( \Auth::user()->user_role == 1 )
                                    <li>
                                        <a href="{{ route('adminpanel') }}" >Adminpanel</a>
                                    </li>
                                @endif
                                <li>
                                    <a href="{{ route('dashboard') }}" >Dashboard</a>
                                </li>
                                <li>
                                    <a href="{{ route('account') }}" >My Account</a>
                                </li>
                                <li>
                                    <a href="{{ route('transaction') }}" >My Transactions</a>
                                </li>
                                <li>
                                    <a href="{{ route('logout') }}" onclick="event.preventDefault();document.getElementById('logout-form').submit();">
                                        Logout
                                    </a>
                                    <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                                        {{ csrf_field() }}
                                    </form>
                                </li>
                            </ul>
                        </li>
                        @endauth
                </ul>
            </div><!-- /.navbar-collapse -->
        </div><!-- /.container-fluid -->
    </nav>
    <div class="crypto-container">
        <div id="mySidenav" class="sidenav">
            <span class="logo-title">CRYPTO FANTASY</span>
            <a href="javascript:void(0)" class="closebtn" id="div_closebtn">&times;</a>
            <header role="banner">
                <nav class="nav" role="navigation">
                    <ul class="nav__list">
                        @if ( $menu_data )
                            @foreach($menu_data as $type)
                                <li>
                                    <a href="#"><span class="fa fa-angle-right"></span>{{ $type['type_name'] }}</a>
                                    @if ( $type['team_data'] )
                                        <ul class="{{ (count($type['team_data'])>10) ? "group-list": "" }}">
                                            @foreach($type['team_data'] as $team)
                                                <li><a href="/marketplace/{{ $team['_id'] }}">{{ $team['team_name'] }}</a></li>
                                            @endforeach
                                        </ul>
                                    @endif
                                </li>
                            @endforeach
                        @endif
                        @guest
                        <li><a href="{{ route('login') }}">SignIn</a></li>
                        <li><a href="{{ route('register') }}">SignUp</a></li>
                        @else
                            <li class="dropdown">
                                <a href="#">
                                    {{ Auth::user()->username }} <span class="fa fa-angle-right"></span>
                                </a>
                                <!-- Authentication Links -->
                                <ul>
                                    @if ( \Auth::user()->user_role == 1 )
                                        <li>
                                            <a href="{{ route('adminpanel') }}" >Adminpanel</a>
                                        </li>
                                    @endif
                                    <li>
                                        <a href="{{ route('dashboard') }}" >Dashboard</a>
                                    </li>
                                    <li>
                                        <a href="{{ route('account') }}" >My Account</a>
                                    </li>
                                    <li>
                                        <a href="{{ route('transaction') }}" >My Transactions</a>
                                    </li>
                                    <li>
                                        <a href="{{ route('logout') }}" onclick="event.preventDefault();document.getElementById('logout-form').submit();">
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
                </nav>
            </header>
        </div>

        <div class="col-xs-12 col-md-12 crypto-celebrity-container">
            <div class="py-4 container-fluid marketplace-container">
                @yield('content')
            </div>
        </div>
    </div>
</div>
<!-- Scripts -->
<script src="{{ asset('js/app.js') }}"></script>
<script>
    var isMobile = false; //initiate as false
    $(document).ready(function(){
        doOnResizeAppBody();
        $(window).resize(function(){
            doOnResizeAppBody();
        });

        $(window).scroll(function(){
            var scroll = $(window).scrollTop();
            var _wH = $(window).height();
            if (scroll > _wH) {
                $('.navbar-laravel').addClass('black-background');
            } else {
                $('.navbar-laravel').removeClass('black-background');
            }
        });
//        $(window).click(function(event){
//            if (event.target.id != 'div_open') {
//                sidebar_width = parseInt(document.getElementById("mySidenav").style.width);
//                if ( sidebar_width > 0 ) {
//                    document.getElementById("mySidenav").style.width = '0';
//                }
//            }
//
//        });

        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
            isMobile = true;
        }

        $(".nav a").click(function() {
            var link = $(this);
            var closest_ul = link.closest("ul");
            var parallel_active_links = closest_ul.find(".active");
            var closest_li = link.closest("li");
            var link_status = closest_li.hasClass("active");
            var count = 0;

            closest_ul.find("ul").slideUp("fast", function() {
                if (++count == closest_ul.find("ul").length)
                    parallel_active_links.removeClass("active");
            });

            if (!link_status) {
                closest_li.children("ul").slideDown("fast");
                closest_li.addClass("active");
            }
        });

        $('img.logo-icon').click(function(){
            document.getElementById("mySidenav").style.width = "300px";
        });
        $('#div_open').click(function() {
            document.getElementById("mySidenav").style.width = "300px";
        });
        $('#div_closebtn').click(function(){
            document.getElementById("mySidenav").style.width = "0";
        });
//        $.get('/api/v1/public/marketplacemenu', function(menu_data){
        menuHTML = '';
        var wH = $(window)[0].innerHeight-100;
        if ( menu_data.length>5 ) {
            for(i=0;i<5;i++) {
                var type = menu_data[i];
                menuHTML += '<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">' + type.type_name + ' <span class="caret"></span></a>';
                team_data = type.team_data;
                if (team_data.length >= 1) {
                    if ( isMobile && team_data.length>=10 )
                        menuHTML += '<ul class="dropdown-menu"  style="overflow-y:scroll;height:'+wH+'px">';
                    else
                        menuHTML += '<ul class="dropdown-menu" >';
                    for (j in team_data) {
                        team = team_data[j];
                        menuHTML += '<li><a href="/marketplace/'+team._id+'" id="' + team._id + '" >' + team.team_name + '</a></li>';
                    }
                    menuHTML += '</ul>';
                }
                menuHTML += '</li>';
            }
            menuHTML += '<li class="dropdown">\
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown">More <b class="caret"></b></a>\
                            <ul class="dropdown-menu">';
            for(i=5;i<menu_data.length;i++) {
                var type = menu_data[i];
                menuHTML += '<li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">' + type.type_name + '</a>';
                team_data = type.team_data;
                if (team_data.length >= 1) {
                    if ( isMobile && team_data.length>=10 )
                        menuHTML += '<ul class="dropdown-menu"  style="overflow-y:scroll;height:'+wH+'px">';
                    else
                        menuHTML += '<ul class="dropdown-menu" >';
                    for (j in team_data) {
                        team = team_data[j];
                        menuHTML += '<li><a href="/marketplace/'+team._id+'" id="' + team._id + '" >' + team.team_name + '</a></li>';
                    }
                    menuHTML += '</ul>';
                }
                menuHTML += '</li>';
            }
            menuHTML += '</ul></li>';
        }
        else {
            for( i in menu_data ) {
                var type = menu_data[i];
                menuHTML += '<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">' + type.type_name + ' <span class="caret"></span></a>';
                team_data = type.team_data;
                if (team_data.length >= 1) {
                    if ( isMobile && team_data.length>=10 )
                        menuHTML += '<ul class="dropdown-menu"  style="overflow-y:scroll;height:'+wH+'px">';
                    else
                        menuHTML += '<ul class="dropdown-menu" >';
                    for (j in team_data) {
                        team = team_data[j];
                        menuHTML += '<li><a href="/marketplace/'+team._id+'" id="' + team._id + '" >' + team.team_name + '</a></li>';
                    }
                    menuHTML += '</ul>';
                }

                menuHTML += '</li>';
            }
        }

        $('#dropdown_marketplace_menu').html(menuHTML);


        (function($){
            $(document).ready(function(){
                $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    $(this).parent().siblings().removeClass('open');
                    $(this).parent().toggleClass('open');
                });
            });
        })(jQuery);

//        });

        $('body').css('height', ($(window)[0].innerHeight)+'px');
        if ( isMobile == false ) {
//            $('.app-home-body').css('height', ($(window)[0].innerHeight*0.8)+'px');
        }


    });

    doOnResizeAppBody = function() {
//        $('.app-body').css('width', $(window)[0].innerWidth);
//        $('.app-body').css('height', $(window)[0].innerHeight);
    }
</script>
</body>
</html>
