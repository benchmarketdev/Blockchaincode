@extends('frontend.layouts.header')

@section('content')
<link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<link href="{{ asset('css/cryptocoins.css') }}" rel="stylesheet">
<link href="{{ asset('css/frontend/home.css') }}" rel="stylesheet">
<script src="{{ asset('./assets/particles/particles.js') }}"></script>
<div id="home" class="container-fluid padding0" style="margin: 0px -15px;">
    <div class="app-home-body">
        <canvas id="particles-js" width="100%" height="720px"></canvas>
        <div class="row div-absolute-top">
            <div class="col-xs-12 col-md-7 home-title">
                <label class="white-color label-title-trading">TRADING ATHLETES</label>
                <label class="white-color label-title-create">CREATE YOUR OWN GAME</label>
                <label class="white-color label-title-make">MAKE PROFITS ON BLOCKCHAIN</label>
                <label class="white-color label-title-now">NOW!</label>
                <div class="text-center div-home-btn-wrap">
                    <a href="" class="fantasy-button buttonBlue btn-font28 a-button">MARKET PLACE</a>
                    <a href="" class="fantasy-button buttonBlue btn-font28 a-button a-top-games">TOP GAMES</a>
                </div>

            </div>
            <div class="col-xs-12 col-md-5 div-home-athlete-card-wrap">
                <canvas id="myCanvas" width="700" height="700"></canvas>
                <div class="home-athlete-card" ></div>
            </div>
        </div>
    </div>
    <div class="div-stats-wrap">
        <div class="row">
            <div class="col-xs-12">
                <label class="white-color label-title-stats">STATS</label>
            </div>
        </div>
        <div class="row div-row-stats-contents">
            <div class="col-xs-12 col-sm-4 text-center">
                <span class="span-block size-64 pt-40"><i class="cc ETH-alt" aria-hidden="true"></i></span>
                <span class="span-block size-48 pt-40">{{ number_format($site_data['transaction_value'], 2, '.',',') }}</span>
                <span class="span-block pt-40">Total transaction volume (ETH)</span>
            </div>
            <div class="col-xs-12 col-sm-4 text-center">
                <span class="span-block size-64 pt-40"><i class="fa fa-credit-card" aria-hidden="true"></i></span>
                <span class="span-block size-48 pt-40">{{ $site_data['active_contracts'] }}</span>
                <span class="span-block pt-40">Active Contracts</span>
            </div>
            <div class="col-xs-12 col-sm-4 text-center">
                <span class="span-block size-64 pt-40"><i class="fa fa-users" aria-hidden="true"></i></span>
                <span class="span-block size-48 pt-40">{{ $site_data['contract_holders'] }}</span>
                <span class="span-block pt-40">Contract Holders</span>
            </div>
        </div>
    </div>
    <div class="div-top-athletes-wrap">
        <div class="row">
            <div class="col-xs-12">
                <label class="white-color label-title-stats">ATHLETES</label>
            </div>
        </div>
        <div class="row wrap-row div-pt50-pb10" id="top_athletes_list">
            @if ( $top_athletes )
                @foreach( $top_athletes as $athlete )
                <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3">
                    @include('frontend.partial.athlete', ['athlete' => $athlete, 'provider' => $provider, 'contractAddress'=>$contractAddress, 'canBought'=>true])
                </div>
                @endforeach
            @endif
        </div>
        <div class="row div-sep">
            <div class="col-sm-12 text-right">
                <button type="button" id="btn_view_more" class="btn-action" onclick="">View More...</button>
                {{--<button type="button" id="btn_next" class="btn-action" onclick=""></button>--}}
            </div>
        </div>
    </div>
    <div class="div-what-is-crypto-fantasy-wrap">
        <div class="row">
            <div class="col-xs-12">
                <label class="white-color label-title-what-is">WHAT IS</label>
                <label class="white-color label-title-crypto-fantasy">CRYPTO FANTASY</label>
            </div>
        </div>
        <div class="row div-what-is-crypto-fantasy-contents-wrap">
            <div class="col-xs-12 col-md-7 div-pl60-pr60">
                <label class="label-content-crypto-fantasy">
                    Lorem Ipsum is simply dummy text
                    of the printing and typesetting industry.
                    Lorem Ipsum has
                    been the industry's standard dummy text
                    ever since the 1500s
                    , when an
                    unknown printer took a galley of type
                    and scrambled it to
                    make a type specimen book.
                    It has survived
                    not only five centuries, but
                    also the leap into
                    electronic typesetting, remaining essentially
                    unchanged.
                    It was popularised
                    in the 1960s with the
                    release of Letraset sheets containing Lorem
                    Ipsum passages, and more
                    recently with desktop publishing software
                    like Aldus PageMaker including versions of
                    Lorem Ipsum.
                </label>
            </div>
            <div class="col-xs-12 col-md-5">
                <div class="media">
                    <a href="" class="a-label" >
                        <div class="media-left">
                            <img src="{{ asset('./images/icon/icon-coins.png') }}" class="media-object" >
                        </div>
                        <div class="media-body div-media-text">
                            <h4 class="media-heading icon-main white-text">CARD TRADING</h4>
                            <p class="white-text" >Candlestick charts and more.</p>
                        </div>
                    </a>
                </div>
                <div class="media">
                    <div class="media-left">
                        <img src="{{ asset('./images/icon/icon-news.png') }}" class="media-object" >
                    </div>
                    <div class="media-body div-media-text">
                        <h4 class="media-heading icon-main white-text">GAMES</h4>
                        <p class="white-text" >Get the latest news updates about cryptocurrencies.</p>
                    </div>
                </div>
                <div class="media">
                    <div class="media-left">
                        <img src="{{ asset('./images/icon/icon-chart.png') }}" class="media-object" >
                    </div>
                    <div class="media-body div-media-text">
                        <h4 class="media-heading icon-main white-text">PLAYER'S RANKING</h4>
                        <p class="white-text" >All your cryptocurrencies investments at one place.</p>
                    </div>
                </div>
                <div class="media">
                    <div class="media-left">
                        <img src="{{ asset('./images/icon/icon-fiat.png') }}" class="media-object" >
                    </div>
                    <div class="media-body div-media-text">
                        <h4 class="media-heading icon-main white-text">FIAT</h4>
                        <p class="white-text" >Different major fiat currencies such as USD, CAD, AUD, GBP, EUR etc.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="div-faq">
        <div class="container">
            <div class="div-top-title text-center">
                <label class="white-color label-title-crypto-fantasy">FAQ</label>
                <label class="white-color label-faq-subtitle" >HERE IS OUR MOST FREQUENTLY QUESTIONS ASKED AND ANSWERS.</label>
            </div>
            <div class="row">
                <div class="col-sm-12">
                    <div class="panel-group" id="accordion">
                        <div class="panel panel-default" style="margin-right:20%;width:80%;">
                            <div class="panel-heading">
                                <h4 class="panel-title">
                                    <a data-toggle="collapse" class="a-label a-faq" data-parent="#accordion" href="#faq1">
                                        <img src="{{ asset('./images/icon/faq-icon.png') }}" class="img-faq-icon">
                                        Which currencies do you offer?
                                    </a>
                                </h4>
                            </div>
                            <div id="faq1" class="div-faq-content panel-collapse collapse">
                                We offer all coins listed on <a href="https://coinmarketcap.com" target="_blank" style="color:gold;">coinmarketcap.com</a>
                            </div>
                        </div>
                        <div class="panel panel-default" style="margin-left:20%;width:80%;">
                            <div class="panel-heading">
                                <h4 class="panel-title">
                                    <a data-toggle="collapse" class="a-label a-faq" data-parent="#accordion" href="#faq2">
                                        <img src="{{ asset('./images/icon/faq-icon.png') }}" class="img-faq-icon">
                                        Is there a mobile version?
                                    </a>
                                </h4>
                            </div>
                            <div id="faq2" class="div-faq-content panel-collapse collapse">
                                At the moment there is no mobile version, but there will be in future.
                            </div>
                        </div>
                        <div class="panel panel-default" style="margin-left:20%;width:80%;">
                            <div class="panel-heading">
                                <h4 class="panel-title">
                                    <a data-toggle="collapse" class="a-label a-faq" data-parent="#accordion" href="#faq4">
                                        <img src="{{ asset('./images/icon/faq-icon.png') }}" class="img-faq-icon">
                                        Are there price alerts?
                                    </a>
                                </h4>
                            </div>
                            <div id="faq4" class="div-faq-content panel-collapse collapse">
                                Yes, you can set an price alert and you will receive an email or audio alert once your price strike has been hit.
                            </div>
                        </div>
                        <div class="panel panel-default" style="margin-right:20%;width:80%;">
                            <div class="panel-heading">
                                <h4 class="panel-title">
                                    <a data-toggle="collapse" class="a-label a-faq" data-parent="#accordion" href="#faq5">
                                        <img src="{{ asset('./images/icon/faq-icon.png') }}" class="img-faq-icon">
                                        Could I trade from Moonfolio?
                                    </a>
                                </h4>
                            </div>
                            <div id="faq5" class="div-faq-content panel-collapse collapse">
                                Not yet, but we will add this in future.
                            </div>
                        </div>
                        <div class="panel panel-default" style="margin-left:20%;width:80%;">
                            <div class="panel-heading">
                                <h4 class="panel-title">
                                    <a data-toggle="collapse" class="a-label a-faq" data-parent="#accordion" href="#faq6">
                                        <img src="{{ asset('./images/icon/faq-icon.png') }}" class="img-faq-icon">
                                        Is the pricing real time?
                                    </a>
                                </h4>
                            </div>
                            <div id="faq6" class="div-faq-content panel-collapse collapse">
                                Yes, it will be update every seconds.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="div-aboutus">
        <div class="container">
            <div class="row">
                <div class="col-sm-12 text-center">
                    <label class="white-color label-title-crypto-fantasy">ABOUT US</label>
                    <label class="white-color label-faq-subtitle">
                        We are a group of financial engineers, traders and blockchain enthusiasts with a mission to create the best portfolio tracker on the web.
                    </label>
                </div>
                <div class="col-sm-12">
                    <div class="div-top-title">
                        <label class="white-color label-title-crypto-fantasy" >CONTACT US</label>
                    </div>
                </div>
                <div class="col-sm-12">
                    <form class="form-horizontal form-contact" action="">
                        <div class="row">
                            <div class="form-group form-contact-control col-sm-6">
                                <label for="name">NAME:</label>
                                <input type="text" class="form-control" id="name" placeholder="" name="name">
                            </div>
                            <div class="form-group form-contact-control col-sm-6">
                                <label for="email">EMAIL:</label>
                                <input type="email" class="form-control" id="email" placeholder="" name="email">
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group form-contact-control col-sm-12">
                                <label for="we_help">HOW CAN WE HELP?</label>
                                <textarea class="form-control" id="we_help" placeholder="" name="we_help" cols="7"></textarea>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group form-contact-control col-sm-12">
                                <label for="for_you">WHAT CAN WE DO FOR YOU?</label>
                                <textarea class="form-control" id="for_you" style="height:100px;" name="for_you" cols="10"></textarea>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-8" style="padding-top: 17px;">
                                {{--RECEIVE MONTHLY TIPS ON ACHIEVING RESULTS--}}
                            </div>
                            <div class="col-sm-4">
                                <button class="btn btn-primary btn-sendmessage">SEND MESSAGE</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>


</div>
<div class="div-footer">
    <div class="container">
        <label class="footer-copyright-label">
            <i class="fa fa-copyright"></i>2018 Crypto Fantasy. All rights reserved.
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a class="a-white a-terms" data-toggle="modal" data-target="#terms_dlg">Terms and Conditions</a>
        </label>
        {{--<a href="#home" class="a-label footer-backtotop" style="width:200px;">--}}
        {{--Back to Top&nbsp;&nbsp;&nbsp; <img src="{{ asset('./images/icon/icon-top.png') }}" />--}}
        {{--</a>--}}
    </div>
</div>
<script src="{{ asset('./js/frontend/home.js') }}" ></script>
@endsection
