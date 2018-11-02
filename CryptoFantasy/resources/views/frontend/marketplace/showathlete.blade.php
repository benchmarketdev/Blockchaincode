@extends('frontend.layouts.header')

@section('content')
<link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<link href="{{ asset('css/cryptocoins.css') }}" rel="stylesheet">
<link href="{{ asset('css/frontend/home.css') }}" rel="stylesheet">
<style>
    .app-body {
        height: 100%;
    }
    .chat-container {
        padding: 5px;
        border: 1px solid grey;
        border-radius: 5px;
        min-width: 320px;
        width: 320px;
        margin: auto;
        min-height: 220px;
        max-height: 560px;
    }
    .message-container {
        /*border: 2px solid #dedede05;*/
        /*background-color: #f1f1f100;*/
        /*border-radius: 5px;*/
        padding: 0 5px;
        margin: 0;
        word-wrap: break-word;
        line-height: 1;
    }
    .darker {
        background-color: #83a3de12;
    }
    .message-container::after {
        content: "";
        clear: both;
        display: table;
    }
    .message-container img {
        float: left;
        max-width: 60px;
        width: 100%;
        margin-right: 20px;
        border-radius: 50%;
    }
    .message-container img.right {
        float: right;
        margin-left: 20px;
        margin-right:0;
    }
    .time-right {
        float: right;
        color: #aaa;
    }
    .time-left {
        float: left;
        color: #999;
    }
    input[type=text] {
        padding: 5px;
        font-size: 17px;
        border: 1px solid grey;
        border-right:none;
        float: left;
        width: 80%;
        background: transparent;
    }

    button {
        float: left;
        width: 20%;
        padding: 5px;
        background: #56565661;
        color: white;
        font-size: 17px;
        border: 1px solid grey;
        border-left: none;
        cursor: pointer;
    }

    button:hover {
        background: #0b7dda;
    }

    .form-chat::after {
        content: "";
        clear: both;
        display: table;
    }
    .message-wraper {
        overflow-y: auto;
        margin-bottom: 1px;
        min-height: 220px;
        height: 480px;
    }
    .span-username {
        color: #b9b9ff;
        cursor: pointer;
    }
    .span-message-content {

    }
    .italic-font {
        font-style: italic;
    }
    #chatroom {
        background: black;
        position: absolute;
        z-index: 9;
        border: 1px solid #d3d3d3;
        resize: both;
        overflow: auto;
    }
    #chatroom_header {
        padding: 10px;
        cursor: move;
        z-index: 10;
        background-color: #2196F3;
        color: #fff;
    }
    .chat-edit-message {
        /*position: absolute;*/
        width: 100%;
        /*bottom: 5px;*/
    }

</style>
<script>
    var chatting = undefined;
</script>
<div class="div-page-wrap">
    <h3 class="h-title" > Athlete </h3>
    <div class="row">
        <div class="col-xs-12 col-sm-4">
            @include('frontend.partial.athlete', ['athlete' => $athlete, 'provider' => $provider, 'contractAddress'=>$contractAddress, 'canBought'=>true])


            @guest
            @else
                @if ( \Auth::user()->was_bought )
                    <script>
                        var chatting = true;
                        var user_id = '<?php echo \Auth::user()->id; ?>';
                    </script>
                        <div class="chat-container">
                            <div class="message-wraper">
                            </div>
                            <div class="chat-edit-message">
                                <div class="form-chat">
                                    <input type="text" name="message" placeholder="Write a message" >
                                    <button type="button" onclick="doOnSendMessage()">Send</button>
                                </div>
                            </div>
                        </div>
                @endif
            @endguest
        </div>
        <div class="col-xs-12 col-sm-8">
            <div class="row">
                <div class="col-md-12">
                    <div class="panel">
                        <div class="h-title fontsize28"> Athlete Details </div>
                        <div class="panel-body panel-athlete-detail-body">
                            <div class="row">
                                <div class="col-xs-7 col-sm-3 text-right">Current Owner:</div>
                                <div class="col-xs-5 col-sm-3">{{ $athlete['player_name'] }}</div>
                            </div>
                            <div class="row">
                                <div class="col-xs-7 col-sm-3 text-right">Verification status:</div>
                                <div class="col-xs-5 col-sm-3" style="padding-right: 5px;">Not verified yet</div>
                            </div>
                            <div class="row">
                                <div class="col-xs-7 col-sm-3 text-right">Ranking:</div>
                                <div class="col-xs-5 col-sm-3 xs-text">{{ (isset($athlete['ranking']) && $athlete['ranking'] != '') ? $athlete['ranking'] : "N/A"  }}</div>
                            </div>
                            <div class="row">
                                <div class="col-xs-7 col-sm-3 text-right xs-text">Changes:</div>
                                <div class="col-xs-5 col-sm-3 xs-text">{{ (isset($athlete['changes']) && $athlete['changes'] != '') ? $athlete['changes']."%" : "N/A" }}</div>
                            </div>
                            <div class="row">
                                <div class="col-xs-7 col-sm-3 text-right">Current Price:</div>
                                <div class="col-xs-5 col-sm-3">{{ $athlete['price'] }}</div>
                            </div>
                            <div class="row">
                                <div class="col-xs-7 col-sm-3 text-right">Token ID:</div>
                                <div class="col-xs-5 col-sm-3">{{ $athlete['token_id'] }}</div>
                            </div>
                            <div class="row" style="display: none;">
                                <h3 class="h-title fontsize20">Athlete informations</h3>
                                <div class="col-md-12">
                                    <?php //echo html_entity_decode($athlete['mass']); ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <div class="panel">
                        <div class="h-title fontsize28"> Latest Transactions </div>
                        <div class="panel-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Owner</th>
                                        <th>Price</th>
                                        <th>Date</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    @if ($owner_history)
                                        @foreach( $owner_history as $idx=>$history )
                                            <tr>
                                                <td>{{ $idx+1 }}</td>
                                                <td>
                                                    <a href="/userathlete/{{ $history['owner_id'] }}">{{ $history['owner_name'] }}</a>
                                                </td>
                                                <td>{{ $history['price'] }}</td>
                                                <td>{{ $history['date'] }}</td>
                                            </tr>
                                        @endforeach
                                    @endif
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="{{ asset('./js/frontend/chat.js') }}" ></script>
<script>
    $('.btn-bottom-athlete').click(function(){
        window.location.href = $(this).attr('a-href');
    });


</script>
{{--<script src="{{ asset('./js/app.js') }}" ></script>--}}
@endsection
