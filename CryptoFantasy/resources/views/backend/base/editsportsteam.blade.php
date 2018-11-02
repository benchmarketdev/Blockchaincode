@extends('backend.layouts.manager')

@section('content')
    <style>
        th, td {
            text-align: center;
        }
    </style>
    <div class="row">
        <div class="col-md-12">
            <div class="portlet light portlet-fit portlet-form bordered">
                <div class="portlet-title">
                    <div class="caption">
                        <i class=" icon-layers font-green"></i>
                        <span class="caption-subject font-green sbold uppercase">Sports Team</span>
                    </div>
                </div>
                <div class="portlet-body">


                    <form action="{{ route('editsportsteam') }}" method="post" class="form-horizontal">
                        {{ csrf_field() }}
                        <input type="hidden" name="sports_type_id" />
                        <input type="hidden" name="_id" />
                        <div class="form-body">
                            <div class="form-group form-md-line-input has-success">
                                <label class="col-md-3 control-label" for="form_control_1">Sports Type</label>
                                <div class="col-md-9">
                                    <select class="form-control" name="sports_type_id">
                                        @if( $data )
                                            @foreach( $data as $d )
                                                <option value="{{ $d['_id'] }}">{{ $d['type_name'] }}</option>
                                            @endforeach
                                        @endif
                                    </select>
                                    <div class="form-control-focus"> </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-body">
                            <div class="form-group form-md-line-input has-success">
                                <label class="col-md-3 control-label" for="form_control_1">Team Name</label>
                                <div class="col-md-9">
                                    <input type="text" name="team_name" class="form-control" placeholder="">
                                    <div class="form-control-focus"> </div>
                                    <span class="help-block">Please enter sports team name here...</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <div class="row">
                                <div class="col-md-12 text-right">
                                    <button type="submit" class="btn green">Submit</button>
                                </div>
                            </div>
                        </div>
                    </form>
                    <div class="portlet box green">
                        <div class="portlet-title">
                            <div class="caption font-dark">
                                <i class="icon-settings font-dark"></i>
                                <span class="caption-subject bold uppercase">Sports Team</span>
                            </div>
                            <div class="tools">
                                <a href="javascript:;" class="collapse"> </a>
                                <a href="javascript:;" class="reload"> </a>
                            </div>
                        </div>
                        <div class="portlet-body">
                            <table class="table table-striped table-bordered table-hover dt-responsive" width="100%" id="sample_1">
                                <thead>
                                <tr>
                                    <th> # </th>
                                    <th> Type </th>
                                    <th> Action </th>
                                    <th> Action </th>
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
    <script src="{{ asset('./js/backend/base/sportsteam.js') }}" ></script>
@endsection