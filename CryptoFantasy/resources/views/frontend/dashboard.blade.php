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
</style>
@section('content')
    <link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<div class="container-fluid div-page-wrap">
    <h3 class="h-title">Dashboard (Total: {{ count($athletes) }})</h3>
    @if ( $athletes )
        <div class="row">
            @foreach( $athletes as $idx=>$athlete )
                <div class="col-xs-12 col-sm-4 col-md-3">
                    <div class="athlete-card" athlete-id="{{ $athlete['_id'] }}">
                        <div class="athlete-top-title" >
                            <label class="white-text label-athlete-playername">{{ $athlete['player_name'] }}</label>
                            <div class="div-athlete-status athlete-status-icon">
                                {{--<i class="white-text fa fa-check-circle"></i>--}}
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
                        {{--<div class="div-btn-bottom-athlete-wrap disabled text-center" style="width:100%;">--}}
                            {{--<a href="/showbuycontract/{{ $athlete['_id'] }}" class="btn-bottom-athlete" >BUY THIS ATHLETE</a>--}}
                        {{--</div>--}}
                    </div>
                </div>
            @endforeach
        </div>
    @else
        <div class="row" style="margin-top:22px;">
            <div class="col-sm-12 text-center">
                <h1 style="color:white;">No Data</h1>
            </div>
        </div>
    @endif
</div>
    <script src="{{ asset('./js/frontend/dashboard.js') }}"></script>
@endsection