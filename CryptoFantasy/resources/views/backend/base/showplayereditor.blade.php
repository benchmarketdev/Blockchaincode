@extends('backend.layouts.manager')

@section('content')
    <link href="{{ asset('./assets/metronic/global/plugins/jstree/dist/themes/default/style.min.css') }}" rel="stylesheet" type="text/css" />
    <style>
        th, td {
            text-align: center;
        }
    </style>
    <div class="row">
        <div class="col-xs-12 col-md-5">
            <div class="portlet light bordered">
                <div class="portlet-title">
                    <div class="caption">
                        <i class="icon-social-dribbble font-blue-sharp"></i>
                        <span class="caption-subject font-blue-sharp bold uppercase">Team</span>
                    </div>
                </div>
                <div class="portlet-body">
                    <div id="tree_1" class="tree-demo">
                        <ul>
                            <li data-jstree='{ "opened" : true }'> Sports
                                @if( $tree_data )
                                    <ul>
                                        <?php $n = 0; ?>
                                        @foreach( $tree_data as $data )
                                            <li data-jstree='{ "opened" : true }'> {{ $data['type_name'] }}
                                                @if ( $data['team_data'] )
                                                    <ul>
                                                        @foreach( $data['team_data'] as $team )
                                                            <li data-jstree='{ "type" : "file" }' id="{{ $team['_id'] }}" onclick="doOnTeamClick(this)">{{ $team['team_name'] }}</li>
                                                        @endforeach
                                                    </ul>
                                                @endif
                                            </li>
                                        @endforeach
                                    </ul>
                                @endif
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xs-12 col-md-7">
            <div class="portlet light bordered">
                <div class="portlet-title">
                    <div class="caption">
                        <i class="fa fa-users font-blue-sharp"></i>
                        <span class="caption-subject font-blue-sharp bold uppercase">Players</span>
                    </div>
                </div>
                <div class="portlet-body">
                    <div class="portlet light portlet-fit bordered">
                        <div class="portlet-body">
                            <div class="table-toolbar">
                                <form class="form-horizontal">
                                    {{ csrf_field() }}
                                    <input type="hidden" name="team_id" />
                                    <input type="hidden" name="_id" />
                                    <div class="form-body">
                                        <div class="form-group form-md-line-input has-success">
                                            <label class="col-md-3 control-label" for="form_control_1">Player Name</label>
                                            <div class="col-md-9">
                                                <input type="text" name="player_name" class="form-control" placeholder="">
                                                <div class="form-control-focus"> </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-actions">
                                        <div class="row">
                                            <div class="col-md-offset-9 col-md-3">
                                                <button type="button" id="btn_add_player" class="btn green"> Submit </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <table class="table table-striped table-hover table-bordered" id="sample_editable_1">
                                <thead>
                                <tr>
                                    <th> # </th>
                                    <th> Player Name </th>
                                    <th> Edit </th>
                                    <th> Delete </th>
                                </tr>
                                </thead>
                                <tbody id="tbody_content">

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


<script src="{{ asset('./js/backend/base/sportsplayer.js') }}" ></script>
@endsection