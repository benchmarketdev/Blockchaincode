@if ( !isset($athlete_type) )
    <div class="athlete-card {{ (isset($grey) && $grey == true) ? "grey-image" : "" }}" athlete-id="{{ $athlete['_id'] }}" >
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
                <a href="/userathlete/{{ $athlete['owner_id'] }}" target="_blank" class="a-label span-wrap">&nbsp;{{ $athlete['owner_name'] }}</a>
            </div>
            <div class="col-xs-5 padding0">
                <label class="float-right">
                    <a href="https://{{ ($provider == 'test') ? 'ropsten.' : '' }}etherscan.io/address/{{ $contractAddress }}" target="_blank" class="a-label span-wrap" style="width:140px;float: none;">Contract Link</a>
                </label>
            </div>
        </div>
    </div>
    @if ( $canBought )
        <div id="div_buy" class="a-label div-btn-bottom-athlete-wrap text-center" style="width:100%;">
            <a a-href="/showbuycontract/{{ $athlete['_id'] }}" class="btn-bottom-athlete">BUY THIS ATHLETE</a>
        </div>
    @endif
</div>
@else
    <div class="athlete-card {{ (isset($grey) && $grey == true) ? "grey-image" : "" }}" athlete-id="{{ $athlete['_id'] }}" >
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
                        {{ $athlete['transactions'] }}
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
                    {{ $athlete['owner_name'] }}
                </div>
                <div class="col-xs-5 padding0">
                    <label class="float-right">
                        Contract Link
                    </label>
                </div>
            </div>
        </div>
        @if ( $canBought )
            <div id="div_buy" class="a-label div-btn-bottom-athlete-wrap text-center" style="width:100%;">
                <a a-href="/showbuycontract/{{ $athlete['_id'] }}" href="/showbuycontract/{{ $athlete['_id'] }}" class="btn-bottom-athlete">BUY THIS ATHLETE</a>
            </div>
        @endif
    </div>
@endif