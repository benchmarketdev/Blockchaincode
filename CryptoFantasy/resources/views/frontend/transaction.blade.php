@extends('frontend.layouts.header')
<style>
    @media (min-width: 768px){
        .container {
            padding-top: 50px;
        }
    }
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
<div class="container div-page-wrap">
    <h3 class="h-title">Transaction</h3>
    <div class="row">
        <div class="col-md-12">
            <div class="table-responsive">
                <table width="100%" class="table crypto-form padding0">
                    <thead>
                    <tr>
                        <td align="center">#</td>
                        <td align="center">Side</td>
                        <td align="center">Athlete</td>
                        <td align="center">From</td>
                        <td align="center">To</td>
                        <td align="center">Price</td>
                        <td align="center">Get</td>
                        <td align="center">Profit</td>
                        <td align="center">Date</td>
                    </tr>
                    </thead>
                    <tbody>
                    <?php $no = 0; ?>
                    @if ( $transaction_data )
                        @foreach( $transaction_data as $transaction )
                            <tr class="tr-{{ $transaction['side'] }}">
                                <td align="center" class="white-text">{{ ++$no }}</td>
                                <td align="center" class="{{ $transaction['side'] }}">{{ $transaction['side'] }}</td>
                                <td align="center" class="white-text">{{ $transaction['athlete_info']['player_name'] .' '. $transaction['athlete_info']['team_name']." ".$transaction['athlete_info']['type_name'] }}</td>
                                <td align="center" class="white-text">{{ $transaction['seller_name'] }}</td>
                                <td align="center" class="white-text">{{ $transaction['buyer_name'] }}</td>
                                <td align="center" class="white-text">{{ $transaction['price'] }}</td>
                                <td align="center" class="white-text">{{ ($transaction['get']==0)?"-":$transaction['get'] }}</td>
                                <td align="center" class="white-text">{{ ($transaction['profit']==0)?"-":$transaction['profit'] }}</td>
                                <td align="center" class="white-text">{{ $transaction['created_at'] }}</td>
                            </tr>
                        @endforeach
                    @endif
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
    <script src="{{ asset('./js/frontend/dashboard.js') }}"></script>
@endsection