@extends('frontend.layouts.header')

@section('content')

<link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('./assets/searchfilter/css/suggestion-box.min.css') }}">
<script src="{{ asset('./assets/searchfilter/js/suggestion-box.min.js') }}"></script>
<script>
    var obj = <?php echo json_encode($athletes); ?>;
</script>
<style>
    .right0 {
        padding-right:0;
    }
    .left0 {
        padding-left:0;
    }
    input[type=text] {
        color: white;
        width: 330px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
        background-color: transparent;
        background-image: url({{ asset('./images/searchicon.png') }});
        background-position: 12px 12px;
        background-repeat: no-repeat;
        padding: 12px 20px 12px 40px;
        -webkit-transition: width 0.4s ease-in-out;
        transition: width 0.4s ease-in-out;
    }

    input[type=text]:focus {
        width: 100%;
        border-color: gold;
    }

</style>
<div class="div-page-wrap">
    <div class="row">
        <div class="col-md-12">
            {{--<a class="white-color label-team-name" href="/marketplace/{{ $team_id }}">{{ (isset($team_name)) ? $team_name : "" }}</a>--}}
            <label class="white-color label-team-name">{{ (isset($team_name)) ? $team_name : "" }}</label>
            <form id="searchForm" method="get" action="/search" style="margin-bottom:40px;">
                <input type="text" name="search" placeholder="Search..">
            </form>
        </div>
    </div>

    @if ( $athletes )
        <div class="row">
            @foreach( $athletes as $idx=>$athlete )
                <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3">
                    @if ($athlete['token_id'] != 'NotAllowed')
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
                            <div class="div-btn-bottom-athlete-wrap disabled text-center" style="width:100%;">
                                <a a-href="/showbuycontract/{{ $athlete['_id'] }}" class="btn-bottom-athlete" >BUY THIS ATHLETE</a>
                            </div>
                        </div>
                    @else
                        <div class="athlete-card athlete-disabled-card" athlete-id="not-allowed">
                            <div class="athlete-top-title" >
                                <label class="grey-color label-athlete-playername">{{ $athlete['player_name'] }}</label>
                                <div class="div-athlete-status athlete-status-icon">
                                    <i class="fa fa-lock" style="color:black;"></i>
                                </div>
                            </div>
                            <div class="div-athlete-icon text-center">
                                <img src="{{ $athlete['avatar'] }}" class="athlete-thumb" />
                            </div>
                            <div class="div-athlete-detail">
                                <div class="row" style="padding-bottom: 5px;">
                                    <div class="col-md-6 padding0" style="padding-right:10px;">
                                        <label class="grey-color">Price:</label>
                                        <label class="grey-color float-right">{{ $athlete['price'] }}</label>
                                    </div>
                                    <div class="col-md-6 padding0">
                                        <label class="grey-color">Transactions:</label>
                                        <label class="grey-color float-right">N/A</label>
                                    </div>
                                </div>
                                <div class="row" style="padding-bottom: 5px;">
                                    <div class="col-md-6 padding0" style="padding-right:10px;">
                                        <label class="grey-color">Ranking:</label>
                                        <label class="grey-color float-right">3</label>
                                    </div>
                                    <div class="col-md-6 padding0">
                                        <label class="grey-color">Changed(%):</label>
                                        <label class="grey-color float-right">-0.12</label>
                                    </div>
                                </div>
                                <div class="row" style="padding-bottom: 5px;">
                                    <div class="col-md-6 padding0" style="padding-right:10px;display: flex;">
                                        <label class="grey-color">Owner:</label>
                                        <label class="grey-color">N/A</label>
                                    </div>
                                    <div class="col-md-6 padding0">
                                        <label class="grey-color float-right">N/A</label>
                                    </div>
                                </div>
                            </div>
                            <div class="div-btn-bottom-athlete-wrap disabled text-center" style="width:100%;">
                                <label class="btn-bottom-athlete disabled">NOT ALLOWED</label>
                            </div>
                        </div>
                    @endif

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

<script src="{{ asset('./js/frontend/marketplace.js') }}" ></script>
@endsection
