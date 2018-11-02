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
                        <span class="caption-subject font-green sbold uppercase">Sports Type</span>
                    </div>
                </div>
                <div class="portlet-body">
                    <form action="{{ route('editsportstype') }}" method="post" class="form-horizontal">
                        {{ csrf_field() }}
                        <input type="hidden" name="_id" />
                        <div class="form-body">
                            <div class="form-group form-md-line-input has-success">
                                <label class="col-md-3 control-label" for="form_control_1">Sports type</label>
                                <div class="col-md-9">
                                    <input type="text" name="sports_type" class="form-control" placeholder="">
                                    <div class="form-control-focus"> </div>
                                    <span class="help-block">Please enter sports type here...</span>
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
                </div>
            </div>
        </div>
        <div class="col-md-12">
            <div class="portlet box green">
                <div class="portlet-title">
                    <div class="caption font-dark">
                        <i class="icon-settings font-dark"></i>
                        <span class="caption-subject bold uppercase">Sports Type</span>
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
                                <th> Ordering </th>
                                <th> Action </th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 0; ?>
                            @if( $data )
                                @foreach( $data as $d )
                                    <tr>
                                        <td>{{ ++$no }}</td>
                                        <td>{{ $d['type_name'] }}</td>
                                        <td>{{ $d['type_name'] }}</td>
                                        <td>
                                            <a class="fa fa-edit" onclick="doOnEdit({{ json_encode($d) }})">Edit</a>
                                            &nbsp;&nbsp;&nbsp;
                                            <a class="fa fa-times" style="color:#7F3434;" onclick="doOnDelete('{{ $d['_id'] }}')">Delete</a>
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
<script src="{{ asset('./js/backend/base/sportstype.js') }}" ></script>
@endsection