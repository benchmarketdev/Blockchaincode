@extends('frontend.layouts.header')

@section('content')
<link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
<link href="{{ asset('css/cryptocoins.css') }}" rel="stylesheet">
<link href="{{ asset('css/frontend/home.css') }}" rel="stylesheet">
<link href="{{ asset('css/fileupload.css') }}" rel="stylesheet">
<script>
    var athlete_id = '{{ $athlete['_id'] }}';
    var price = '{{ $athlete['price'] }}';
    var athlete_price = '{{ $athlete['purchase_price'] }}';
    var send_fee = {{ $athlete['send_fee'] }};
    var site_fee = {{ $athlete['site_fee'] }};
</script>
<style>
    .btn-primary {
        color: #fff;
        background-color: #081627;
        border-color: #0b3146;
    }
    .btn-primary:hover {
        background-color: #113448;
    }
    .form-group {
        margin-bottom: 0;
    }
</style>
<h3 class="h-title fontsize28" style="margin-top:50px;"> Athlete </h3>
<div class="row" style="margin-right: -15px;">
    <div class="col-xs-12 col-sm-4">
        {{--@include('frontend.partial.athlete', ['athlete' => $athlete, 'provider' => $provider, 'contractAddress'=>$contractAddress, 'canBought'=>false])--}}

        <div class="athlete-card" athlete-id="{{ $athlete['_id'] }}" >
            <div class="athlete-top-title" >
                <label class="white-text label-athlete-playername">{{ $athlete['player_name'] }}</label>
                <div class="div-athlete-status athlete-status-icon">
                    {{--<i class="white-text fa fa-check-circle"></i>--}}
                </div>
            </div>
            <div class="div-athlete-icon text-center">
                {{--<img src="{{ $athlete['avatar'] }}" class="athlete-thumb" />--}}
                <form id="upload_form" class="avatar-upload" method="POST" action="{{ route('upload.athletephoto') }}" enctype="multipart/form-data">
                    <input type="hidden" name="athleteId" value="{{ $athlete['_id'] }}"/>
                    <div class="avatar-edit">
                        <input type='file' id="imageUpload" name="athlete_photo" accept=".png, .jpg, .jpeg" />
                        <label for="imageUpload"></label>
                    </div>
                    <div class="avatar-preview">
                        <div id="imagePreview" style="background-image: url('{{ $athlete['avatar'] }}');">
                        </div>
                    </div>
                    <div class="div-avatar-upload">
                        <button type="button" id="btn_file_upload" style="display: none;">
                            <i class="fa fa-cloud-upload" ></i>
                            Save Card Image
                        </button>
                    </div>
                </form>
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
                            {{--<a href="https://{{ ($provider == 'test') ? 'ropsten.' : '' }}etherscan.io/address/{{ $contractAddress }}" target="_blank" class="a-label span-wrap" style="width:30px;text-align: right;">--}}
                                {{ $athlete['transactions'] }}
                            {{--</a>--}}
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
                        {{--<a href="/userathlete/{{ $athlete['owner_id'] }}" target="_blank" class="a-label span-wrap">--}}
                            &nbsp;{{ $athlete['owner_name'] }}
                        {{--</a>--}}
                    </div>
                    <div class="col-xs-5 padding0">
                        <label class="float-right">
                            <a href="https://{{ ($provider == 'test') ? 'ropsten.' : '' }}etherscan.io/address/{{ $contractAddress }}" target="_blank" class="a-label span-wrap" style="width:140px;float: none;">Contract Link</a>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-12 text-center">
                <form id="form_change_price" action="{{ route('changeathleteprice') }}" method="post" class="form-horizontal form-bordered crypto-form">
                    {{ csrf_field() }}
                    <div class="form-body">
                        <input type="hidden" name="athlete_id" >
                        <div class="form-group">
                            <div class="col-xs-12">
                                <label class="control-label" style="color: white;">Change sell price</label>
                                <input type='range' id="slider_price" step="0.00001" min="0" max="1" value="0" style="margin-bottom: 25px;" oninput="showVal(this.value)" onchange="showVal(this.value)"/>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="col-xs-5" style="padding-right:0;">
                                <input id="input_price" type="text" value="0" name="price" class="form-control" style="background: transparent;text-align: right;color: white;font-family: sans-serif;" readonly>
                            </div>
                            <div class="col-xs-7">
                                <button type="submit" class="btn btn-primary wide-width" >Change Price</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label style="margin: 10px;">
                                <span class="label-title italic" >You can change the selling price between min</span>
                                <span class="label-title italic" id="min_price"></span>
                                <span class="label-title italic">to max</span>
                                <span class="label-title italic" id="max_price"></span>
                                <span class="label-title italic">only.</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="label-title italic" style="margin: 10px;">
                                *You will receive <label id="span_receive_eth"></label>ETH after sell this athlete.
                            </label>
                        </div>
                    </div>
                </form>
            </div>
        </div>
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
                    </div>
                </div>
            </div>
            <div class="col-md-12">
                <div class="panel">
                    <div class="h-title fontsize28"> Latest Transactions </div>
                    <div class="panel-body" style="padding:0;">
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
<script src="{{ asset('./js/frontend/myathletedetail.js') }}"></script>
@endsection
