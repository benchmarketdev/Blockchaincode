@extends('backend.layouts.manager')
<style>
    .buy {
        color: red;
    }
    .sell {
        color: #38D865;
    }
</style>
@section('content')
    <div class="row">
        <div class="col-md-12">
            <div class="portlet light bordered">
                <div class="portlet-body">
                    <table width="100%" class="crypto-form padding0">
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
                                <tr class="">
                                    <td align="center">{{ ++$no }}</td>
                                    <td align="center">{{ $transaction['side'] }}</td>
                                    <td align="center">{{ $transaction['athlete_info']['player_name'] .' '. $transaction['athlete_info']['team_name']." ".$transaction['athlete_info']['type_name'] }}</td>
                                    <td align="center">{{ $transaction['seller_name'] }}</td>
                                    <td align="center">{{ $transaction['buyer_name'] }}</td>
                                    <td align="center">{{ $transaction['price'] }}</td>
                                    <td align="center">{{ ($transaction['get']==0)?"-":$transaction['get'] }}</td>
                                    <td align="center">{{ ($transaction['profit']==0)?"-":$transaction['profit'] }}</td>
                                    <td align="center">{{ $transaction['created_at'] }}</td>
                                </tr>
                            @endforeach
                        @endif
                        </tbody>
                    </table>
                    <div class="clearfix margin-bottom-20"> </div>
                </div>
            </div>
        </div>
    </div>
@endsection