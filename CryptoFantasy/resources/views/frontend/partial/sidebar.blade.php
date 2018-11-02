<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta content="width=device-width, initial-scale=1" name="viewport" />
<meta content="Preview page of Metronic Admin Theme #1 for statistics, charts, recent events and reports" name="description" />
<meta content="" name="author" />
<link href="{{ asset('./css/frontend/sidebar.css') }}" rel="stylesheet" type="text/css" />

<div class="panel-group" id="accordion">
@if ( $tree_data )
    @foreach( $tree_data as $type_data )
        <div class="panel panel-default">
            <div class="panel-heading">
                <h4 class="panel-title">
                    <a data-toggle="collapse" data-parent="#accordion" href="#{{ $type_data['_id'] }}">{{ $type_data['type_name'] }}</a>
                </h4>
            </div>
            <div id="{{ $type_data['_id'] }}" class="panel-collapse collapse">
                <div class="panel-body">
                @if ( $type_data['team_data'] )
                    @foreach( $type_data['team_data'] as $team_data )
                        <a href="{{ route('editsportstype') }}" class="nav-link" team_id="{{ $team_data['_id'] }}">
                            <span class="title">{{ $team_data['team_name'] }}</span>
                        </a>
                    @endforeach
                @endif
                </div>
            </div>
        </div>
    @endforeach
@endif
</div>

