@extends('backend.layouts.manager')

@section('content')
    <link href="{{ asset('./assets/metronic/global/plugins/jstree/dist/themes/default/style.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./css/celebrity.css') }}" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" href="{{ asset('./assets/jcrop/dist_files/imgareaselect.css') }}">
    <link rel="stylesheet" type="text/css" href="https://cdn3.devexpress.com/jslib/17.2.5/css/dx.common.css" />
    <link rel="dx-theme" data-theme="generic.light" href="https://cdn3.devexpress.com/jslib/17.2.5/css/dx.light.css" />
    <link href="{{ asset('./assets/ext/style.css') }}" rel="stylesheet" type="text/css" />

    <style>
        .checkbox input[type=checkbox], .checkbox-inline input[type=checkbox], .radio input[type=radio], .radio-inline input[type=radio]{
            margin-left: -15px;
        }
        .checkbox label {
            padding-left: 20px;
        }
        #treeview {
            border: #436fb4 solid 2px;
            border-radius: 5px!important;
        }
        .portlet.light {
            padding:0!important;
        }
        #example>thead>tr {
            height: 42px;
            border-bottom: 2px solid #324533;
            background: aliceblue;
        }
        #example>tbody>tr {
            height: 42px;
            border-bottom: 1px solid grey;
        }
        #example>tbody>tr>td {
            vertical-align: middle;
        }
        .loader {
            border: 5px solid #f3f3f3;
            border-radius: 50%!important;
            border-top: 5px solid #3498db;
            width: 20px;
            height: 20px;
            -webkit-animation: spin 2s linear infinite; /* Safari */
            animation: spin 2s linear infinite;
        }
        .invisible {
            display: none;
        }
        /* Safari */
        @-webkit-keyframes spin {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
<script>
    var provider = <?php echo json_encode($provider) ?>;
    var athlete_count = <?php echo count($athlete_datas) ?>;
    var gasPrice = '<?php echo config('app.gasPrice'); ?>';
    var gasLimit = '<?php echo config('app.gasLimit'); ?>';
</script>
    <div class="row">
        <div class="col-md-12">
            <div class="panel panel-info">
                <div class="panel-heading">Athlete Smart Contract Creator</div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-12 text-right">
                            <input type="text" name="athlete_count" value="20"/>
                            <button type="button" class="btn blue" id="create_athlete_contract">Create Athlete Contract</button>
                            <button type="button" class="btn red" id="remove_all_athlete_contract">Remove All Athlete Contract</button>
                        </div>
                        <br>
                        <div class="col-md-12">
                            <table id="athlete_list" class="display" cellspacing="0" width="100%">
                                <thead>
                                <tr>
                                    <th align="center">#</th>
                                    <th align="center">Photo</th>
                                    <th align="center">Player Name</th>
                                    <th align="center">Sport Type</th>
                                    <th align="center">Team Name</th>
                                    <th align="center">Origin Wallet Id</th>
                                    <th align="center">Price</th>
                                    <th align="center">Send Fee</th>
                                    <th align="center">Site Fee</th>
                                    <th align="center">Token ID</th>
                                    <th align="center">Progress</th>
                                </tr>
                                </thead>
                                <tbody>
                                @if ( $athlete_datas )
                                    @foreach( $athlete_datas as $idx=>$athlete )
                                        <tr class="" id="tr_{{ $athlete['_id'] }}" athleteId="{{ $athlete['_id'] }}">
                                            <td align="center">
                                                {{ $idx+1 }}
                                            </td>
                                            <td align="center">
                                                <img src="{{ $athlete['avatar'] }}" width="32px">
                                            </td>
                                            <td>{{ $athlete['player_name'] }}</td>
                                            <td>{{ $athlete['type_name'] }}</td>
                                            <td>{{ $athlete['team_name'] }}</td>
                                            <td>{{ $athlete['origin_wallet_id'] }}</td>
                                            <td align="center">{{ $athlete['price'] }}ETH</td>
                                            <td align="center">{{ $athlete['send_fee'] }}%</td>
                                            <td align="center">{{ $athlete['site_fee'] }}%</td>
                                            <td align="center">
                                                <label id="transactions_{{ $athlete['_id'] }}">{{ (isset($athlete['token_id']))? $athlete['token_id'] : "N/A" }}</label>
                                            </td>
                                            <td align="center">
                                                <div class="loader invisible" id="progress_{{ $athlete['_id'] }}"></div>
                                            </td>
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

    <div id="profile_pic_modal" class="modal fade">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                    <h3>Change Profile Picture</h3>
                </div>
                <div class="modal-body">

                </div>
            </div>
        </div>
    </div>

<script src="{{ asset('./js/backend/celebrity/athletecreate.js') }}" ></script>
@endsection