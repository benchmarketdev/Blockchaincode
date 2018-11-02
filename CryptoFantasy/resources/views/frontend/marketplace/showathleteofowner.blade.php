@extends('frontend.layouts.header')

@section('content')

<link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<link href="{{ asset('css/cryptocoins.css') }}" rel="stylesheet">
<link href="{{ asset('css/frontend/home.css') }}" rel="stylesheet">
<script>
    var obj = <?php echo json_encode($celebrities); ?>;
    console.log(obj);
</script>
<style>
    .a-label{
        font-size: 13px;
    }
</style>

<h3 class="text-center white-text">
    @if ( $user_info['user_role'] != 1 )
        {{ $user_info['username'] }}:
        @if ( $provider == 'test' )
            <a href="https://ropsten.etherscan.io/address/{{ $account_wallet }}" target="_blank">{{ $account_wallet }}</a>
        @else
            <a href="https://etherscan.io/address/{{ $account_wallet }}" target="_blank">{{ $account_wallet }}</a>
        @endif
    @endif
</h3>
@if ( $celebrities )
    <h4 class="text-center white-text">Contracts: {{ count($celebrities) }}</h4>
    <div class="row">
        @foreach( $celebrities as $idx=>$athlete )
            <div class="col-xs-12 col-sm-4 col-md-3">
                @include('frontend.partial.athlete', ['athlete' => $athlete, 'provider' => $provider, 'contractAddress'=>$contractAddress, 'canBought'=>true])
            </div>
        @endforeach
    </div>
@endif
<script src="{{ asset('./js/frontend/marketplace.js') }}" ></script>
@endsection
