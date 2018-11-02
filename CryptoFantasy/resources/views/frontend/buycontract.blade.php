@extends('frontend.layouts.header')
<style>
    .form-control, .control-label{
        background: transparent!important;
        color: white!important;
        border-radius: 0!important;
    }
    .addon-trans{
        min-width: 156px;
        color: #fff!important;
        background-color: #eeeeee1a!important;
    }
    .addon-btn{
        cursor: pointer;
    }
    .addon-btn:hover {
        background-color: #64f14187 !important;
    }

    /* The container */
    .radio-container {
        display: block;
        position: relative;
        padding-left: 140px;
        margin-bottom: 12px;
        cursor: pointer;
        font-size: 16px;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        border: 1px solid gray;
        border-radius: 5px;
    }

    /* Hide the browser's default radio button */
    .radio-container input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
    }

    /* Create a custom radio button */
    .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 130px;
        background-color: #eeeeee33;
        padding: 10px;
        border-top-left-radius: 5px;
        border-top-bottom-radius: 5px;
        /* text-align: center; */
    }

    /* On mouse-over, add a grey background color */
    .radio-container:hover {
        background-color: #cccccc13;
    }

    /* When the radio button is checked, add a blue background */
    .radio-container input:checked ~ .checkmark {
        background-color: #f44336;
    }
    .span-check {
        width: 10px;
        height: 16px;
        display: inline-flex;
        border-bottom: 3px solid #ffffff;
        border-right: 3px solid #ffffff;
        transform: rotate(45deg);
    }
    .span-content{
        display: block;
        position: absolute;
        left: 30px;
        top: 9px;
    }
    .radio-container.wrap-disabled input:checked ~ .checkmark {
        background-color: #545252;
    }

    /* Create the indicator (the dot/circle - hidden when not checked) */
    .checkmark:after {
        content: "";
        position: absolute;
        display: none;
    }
    .span-display {
        /*display: block;*/
    }
    .wrap-disabled {
        color: grey;
    }
    .span-check-hidden {
        display: none;
    }

    @media (max-width: 375px) {
        .span-display {
            width: 100px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
        }
        .span-left {
            vertical-align: top;
        }
        .crypto-form {
            padding: 5px!important;
        }
        .wide-btn{
            width:100%;
        }
        .radio-container {
            padding-left: 130px;
        }
        .checkmark {
            width: 120px;
        }
    }
</style>
<script>
//    Athlete.init();
</script>
@section('content')
    <link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<script>
    var private_key = '<?php echo $account_private_key; ?>';
    var gasPrice = '<?php echo config('app.gasPrice'); ?>';
    var gasLimit = '<?php echo config('app.gasLimit'); ?>';
</script>
<div class="div-page-wrap">
    <h3 class="h-title">Buy Athlete</h3>
    <div class="col-xs-12 col-sm-5 col-md-4">
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
        </div>

    </div>
    <div class="col-xs-12 col-sm-7 col-md-8" style="color:white;">
        <form id="buy_contract_form" role="form" class="form-horizontal crypto-form" method="post" action="/pending/{{ $athlete['_id'] }}">
            {{ csrf_field() }}
            <input type="hidden" name="tokenId" value="{{ $athlete['token_id'] }}">
            <input type="hidden" name="athleteId" value="{{ $athlete['_id'] }}">
            <input type="hidden" name="price" value="{{ $athlete['price'] }}">
            <input type="hidden" name="buy_method" value="">
            <div class="input-group">
                <strong class="buy-title">{{ $athlete['player_name'] }} contract</strong>
                <p>The current buying price for this contract is <strong id="price">{{ $athlete['price'] }}</strong> ETH.</p>
            </div>
            <br>
            <label class="radio-container" id="label_metamask">
                <div id="metamask">
                    <div><span class="span-left">Address:&nbsp;</span><a class="span-display" target="_blank" id="wallet_id" >Importing...</a></div>
                    <div><span class="span-left">Balance:&nbsp;</span><span class="span-display" id="wallet_balance" style="width:80px;">Calculating...</span></div>
                </div>
                <input type="radio" name="radio" id="chk_metamask" checked="checked">
                <label class="checkmark">
                    {{--<span class="span-check span-check-hidden" id="span_chk_metamask"></span>--}}
                    <span class="span-content">Metamask</span>
                </label>
            </label>
            <label class="radio-container" id="label_account">
                <div id="account">
                    <div><span class="span-left">Address:&nbsp;</span><a class="span-display" target="_blank" href="https://{{ ($provider == 'test') ? 'ropsten.' : '' }}etherscan.io/address/{{ $account_wallet_id }}" id="account_wallet_id" >{{ $account_wallet_id }}</a></div>
                    <div><span class="span-left">Balance:&nbsp;</span><span class="span-display" id="account_wallet_balance" style="width:80px;">Calculating...</span></div>
                </div>
                <input type="radio" name="radio" id="chk_account">
                <label class="checkmark">
                    {{--<span class="span-check span-check-hidden" id="span_chk_account"></span>--}}
                    <span class="span-content">Account</span>
                </label>
            </label>
            <div class="form-action text-center">
                <button type="button" class="btn btn-danger wide-btn" id="btn_athlete_buy" >BUY THIS ATHLETE</button>
            </div>
        </form>

    </div>
</div>
<div id="confirmModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title" id="alertmodal_title">Are you sure you would like to purchase this contract?</h4>
            </div>
            <div class="modal-body" id="alertmodal_body">
                Purchase is now pending and will be completed shortly
            </div>
            <div class="modal-footer">
                <button type="button" id="alertmodal_footer_buy" class="btn btn-success" onclick="doOnBuy()">Yes</button>
                <button type="button" id="alertmodal_footer_cancel" class="btn btn-default" data-dismiss="modal">No</button>
            </div>
        </div>
<!--  Your purchase will be in pending status until blockchain network confirmation completes. -->
    </div>
</div>
<script src="{{ asset('./js/frontend/buycontract.js') }}" ></script>
@endsection