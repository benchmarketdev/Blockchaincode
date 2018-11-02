@extends('frontend.layouts.header')
<style>
    .form-control, .control-label{
        background: transparent!important;
        color: white!important;
        border-radius: 0!important;
        border: none!important;
    }
    .form-horizontal {
        /*border: 2px solid white;*/
        border-radius: 7px;
        padding:10px;
        /*background: rgba(0,0,0,0.3);*/
    }
    .label-wallet-id {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .input-number {
        width: 240px!important;
    }
    .border {
        border: 2px white solid;
        margin: 20px!important;
        padding:20px;
    }
    .btn-wide {
        width:100%;
    }
    .paddingLR15 {
        padding-left:15px!important;
        padding-right:15px!important;
    }
    #span_qrcode, #span_copy_address {
        cursor: pointer;
    }
    #qrmodal_body {
        height: 330px;
    }
    .input-group-addon {
        background: transparent!important;
        border: none!important;
        color: white!important;
        font-size: 26px!important;
        cursor:pointer;
    }
    .input-group-addon:hover {
        background: rgba(255,255,255,0.05)!important;
    }
    .invisible {
        display: none!important;
    }
    .modal-title {
        word-wrap: break-word;
    }
    body {
        background: url( {{ asset('./images/background/login-bg.png') }} );
        font-family: monospace, sans-serif;
        background-size: cover;
    }
</style>
<link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<script src="{{ asset('./assets/js/qrcode.js') }}" ></script>
@section('content')
    <div class="container div-page-wrap">
        <h3 class="h-title">Account</h3>
        <form class="form-horizontal" action="{{ route('change.username') }}" method="POST">
            {{ csrf_field() }}
            <div class="form-group">
                <label class="control-label col-sm-3" for="email">Email:</label>
                <div class="col-sm-9">
                    <label class="form-control" >{{ $user['email'] }}</label>
                </div>
            </div>
            <div class="form-group">
                <label class="control-label col-sm-3" for="username">User Name:</label>
                <div class="input-group col-xs-10 col-sm-8 paddingLR15">
                    <input type="text" class="form-control" id="username" name="username" value="{{ $user['username'] }}" placeholder="Enter password" readonly>
                    <span class="input-group-addon btn-default" id="span_username_edit_start" ><i class="fa fa-edit"></i></span>
                    <span class="input-group-addon btn-default invisible" id="span_username_edit_save" ><i class="fa fa-save"></i></span>
                    {{--<button type="submit" class="">Change User Name</button>--}}
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-sm-3" for="pwd">Metamask Wallet Address:</label>
                <div class="input-group col-xs-12 col-sm-8 paddingLR15">
                    <input id="wallet_id" type="text" class="form-control label-wallet-id" value="{{ $user['wallet_id'] }}" readonly>
                    <span class="input-group-addon btn-default" id="span_copy_address" ><i class="fa fa-copy"></i></span>
                    <span class="input-group-addon btn-default" id="span_qrcode" data-toggle="modal" data-target="#qrcodeModal"><i class="glyphicon glyphicon-qrcode"></i></span>
                </div>

            </div>
            <div class="form-group">
                <label class="control-label col-sm-3" for="pwd">Metamask Wallet Balance:</label>
                <div class="col-xs-12 col-sm-8">
                    <label class="form-control" id="label_balance"></label>
                </div>
            </div>
            <div class="form-group">
                <label class="h-title" style="font-size:16px;">
                    If you do not have MetaMask installed, you can deposit ETH the following Account Wallet to buy/sell Athletes.
                    You can withdraw your ETH anytime with 0% fee.
                    However, we highly recommend MetaMask for decentralization purpose.
                </label>
            </div>
            <div class="form-group">
                <label class="control-label col-sm-3" for="pwd">Account Wallet Address:</label>
                <div class="input-group col-xs-12 col-sm-8 paddingLR15">
                    <input id="account_wallet_id" type="text" class="form-control label-wallet-id" value="{{ $user['wallet_id'] }}" readonly>
                    <span class="input-group-addon btn-default" id="span_copy_account_address" ><i class="fa fa-copy"></i></span>
                    <span class="input-group-addon btn-default" id="span_account_qrcode" data-toggle="modal" data-target="#qrcodeAccountModal"><i class="glyphicon glyphicon-qrcode"></i></span>
                </div>

            </div>
            <div class="form-group">
                <label class="control-label col-sm-3" for="pwd">Acount Wallet Balance:</label>
                <div class="col-xs-12 col-sm-8">
                    <label class="form-control" id="label_account_balance"></label>
                </div>
            </div>
        </form>
    </div>

    <div id="qrcodeModal" class="modal fade" role="dialog">
        <div class="modal-dialog">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title text-center" id="wallet_title">{{ $user['wallet_id'] }}</h4>
                </div>
                <div class="modal-body" id="qrmodal_body">
                    <div id="qrcode" class="text-center" style="width:300px; height:300px;margin:auto;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" id="gasmodal_footer_cancel" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

        </div>
    </div>
    <div id="qrcodeAccountModal" class="modal fade" role="dialog">
        <div class="modal-dialog">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title text-center" id="account_wallet_title">{{ $user['wallet_id'] }}</h4>
                </div>
                <div class="modal-body" id="qrmodal_body">
                    <div id="qrcodeforaccount" class="text-center" style="width:300px; height:300px;margin:auto;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" id="gasmodal_footer_cancel" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

        </div>
    </div>
    <script src="{{ asset('./js/frontend/myaccount.js') }}" ></script>
@endsection