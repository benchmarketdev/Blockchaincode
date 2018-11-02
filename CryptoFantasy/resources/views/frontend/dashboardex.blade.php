@extends('frontend.layouts.header')
<style>
    .form-control, .control-label{
        background: transparent!important;
        color: white!important;
        border-radius: 0!important;
    }
    .nav>li>a.tab-menu {
        font-weight: bold!important;
        padding: 5px 15px!important;
    }
    li.active>a {
        color: #22fb0a!important;
        background-color: rgba(255,255,255,0.3)!important;

    }
    .carousel-control {
        font-size: 50px!important;
    }
    .athlete-list-wrap {
        height: 400px;
        overflow-x: auto;
        overflow-y: hidden;
        margin-bottom: 20px;
    }
    .athlete-list {
        height: 100%;
        width: max-content;
    }
    .athlete {
        display: inline-block;
    }
    .athlete-active {
        border-color: gold !important;
    }
    .buy {
        color: red;
    }
    .sell {
        color: #38D865;
    }
    .thdr {

    }
    body {
        background: url( {{ asset('./images/background/login-bg.png') }} );
        font-family: monospace, sans-serif;
        background-size: cover;
    }
    .div-wrap-athlete-editor {
        width: 100%;
        min-height: 500px;
        border: 1px solid rgba(255,255,255,0.3)
    }
    /**********************************************    Carousel Start   ************************************************/
    .wrapper{
        width:100%;
        position:relative;
        margin:5% auto 0;
    }
    .carousel{
        width: 100%;
        position: relative;
        padding-top: 425px;
        overflow: hidden;
    }
    .inner{
        width: 100%;
        height: 100%;
        position: absolute;
        top:0;
        left: 0;
    }
    .slide{
        width: 100%;
        height: 100%;
        position: absolute;
        top:0;
        right:0;
        left:0;
        z-index: 1;
        opacity: 0;
    }
    .slide.active,
    .slide.left,
    .slide.right{
        z-index: 2;
        opacity: 1;
    }
    .js-reset-left{left:auto}
    .slide.left{
        left:-100%;
        right:0;
    }
    .slide.right{
        right:-100%;
        left: auto;
    }
    .transition .slide.left{left:0%}
    .transition .slide.right{right:0%}
    .transition .slide.shift-right{right: 100%;left:auto}
    .transition .slide.shift-left{left: 100%;right:auto}
    .transition .slide{
        transition-property: right, left, margin;
    }
    .indicators{
        width:100%;
        position: absolute;
        bottom: 0;
        z-index: 4;
        padding:0;
        text-align: center;
    }
    .indicators li{
        width: 13px;
        height: 13px;
        display: inline-block;
        margin: 5px;
        background: #fff;
        list-style-type: none;
        border-radius: 50%;
        cursor:pointer;
        transition:background 0.3s ease-out;
    }
    .indicators li.active{background:#0297df}
    .indicators li:hover{background-color:#2b2b2b}
    .arrow{
        width: 20px;
        height: 20px;
        position:absolute;
        top:49%;
        z-index:5;
        border-top:3px solid #fff;
        border-right:3px solid #fff;
        cursor:pointer;
        transition:border-color 0.3s ease-out;
    }
    .arrow:hover{border-color:#0297df}
    .arrow-left{
        left:20px;
        transform:rotate(225deg);
    }
    .arrow-right{
        right:20px;
        transform:rotate(45deg);
    }
    .slide{
        /*text-align:center;*/
        /*padding-top:25%;*/
        padding-left: 3px;
        padding-right: 3px;
        background-size:cover;
    }
    h1{
        width:100px;
        height:100px;
        background-color:rgba(2, 151, 223,0.7);
        margin:auto;
        line-height:100px;
        color:#fff;
        font-size:2.4em;
        border-radius:50%;
    }
    /**********************************************    Carousel  End    ************************************************/
    .athlete-card {
        width: 310px!important;
    }
</style>
@section('content')
<link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">

<div class="container-fluid div-page-wrap">
@if ( $athletes )
    <h3 class="h-title">Dashboard (Total owned athlete count: {{ count($athletes) }})</h3>
    <div class="div-wrap-athlete-editor">
        <div class="row">
            <div class="col-xs-12 col-sm-5 col-md-4">
                <div class="div-athlete-carousel">
                    <div class="wrapper">
                        <div class="carousel">
                            <div class="inner">
                                @foreach( $athletes as $idx=>$athlete )
                                    <div class="slide {{ ($idx==0) ? "active" : "" }}">
                                        <div class="div-pad1-panel">
                                            <div class="athlete-card" athlete-id="{{ $athlete['_id'] }}">
                                                <div class="athlete-top-title" >
                                                    <label class="white-text label-athlete-playername">{{ $athlete['player_name'] }}</label>
                                                    <div class="div-athlete-status athlete-status-icon">
                                                    </div>
                                                </div>
                                                <div class="div-athlete-icon text-center">
                                                    <img src="{{ $athlete['avatar'] }}" class="athlete-thumb" />
                                                </div>
                                                <div class="div-athlete-detail">
                                                    <div class="row" style="padding-bottom: 5px;">
                                                        <div class="col-xs-6 padding0" style="padding-right:5px;">
                                                            <label class="">Price:</label>
                                                            <label class="float-right" id="lbl_sell_price">{{ $athlete['price'] }}</label>
                                                        </div>
                                                        <div class="col-xs-6 padding0" >
                                                            <label class="">Transactions:</label>
                                                            <label class="float-right">
                                                                <a href="https://{{ ($provider == 'test') ? 'ropsten.' : '' }}etherscan.io/address/{{ $contractAddress }}" target="_blank" class="a-label span-wrap" style="width:30px;text-align: right;">
                                                                    {{ $athlete['transactions'] }}
                                                                </a>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="row" style="padding-bottom: 5px;">
                                                        <div class="col-xs-6 padding0" style="padding-right:5px;">
                                                            <label class="">Ranking:</label>
                                                            <label class="float-right">
                                                                {{ (isset($athlete['ranking']) && $athlete['ranking'] != '') ? $athlete['ranking'] : "N/A"  }}
                                                            </label>
                                                        </div>
                                                        <div class="col-xs-6 padding0">
                                                            <label class="">Changed(%):</label>
                                                            <label class="float-right">
                                                                {{ (isset($athlete['changes']) && $athlete['changes'] != '') ? $athlete['changes'] : "N/A"  }}
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="row" style="padding-bottom: 5px;">
                                                        <div class="col-xs-7 padding0" style="padding-right:5px;display: flex;">
                                                            <label class="">Owner:</label>
                                                            <a href="/userathlete/{{ $athlete['owner_id'] }}" target="_blank" class="a-label span-wrap">{{ $athlete['owner_name'] }}</a>
                                                        </div>
                                                        <div class="col-xs-5 padding0">
                                                            <label class="float-right">
                                                                <a href="https://{{ ($provider == 'test') ? 'ropsten.' : '' }}etherscan.io/address/{{ $contractAddress }}" target="_blank" class="a-label span-wrap" style="width:140px;float: none;">Contract Link</a>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                            <div class="arrow arrow-left"></div>
                            <div class="arrow arrow-right"></div>
                        </div>

                    </div>
                </div>
            </div>
            <div class="col-xs-12 col-sm-7 col-md-8">
                <div class="div-thumb-wrap">

                </div>
            </div>
        </div>
    </div>

@else
    <h3 class="h-title">Dashboard (Total owned athlete count: 0)</h3>
    <div class="row" style="margin-top:22px;">
        <div class="col-sm-12 text-center">
            <h1 style="color:white;">No Data</h1>
        </div>
    </div>
@endif
</div>
<script src="{{ asset('./js/frontend/dashboardex.js') }}"></script>
<script src="{{ asset('./js/frontend/dashboard-carousel.js') }}"></script>
@endsection