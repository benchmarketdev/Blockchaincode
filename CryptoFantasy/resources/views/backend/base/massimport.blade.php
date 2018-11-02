@extends('backend.layouts.manager')

@section('content')
    <div class="container-fulid">
        <div class="panel panel-default">
            <div class="panel-heading">Import Mass Data</div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-xs-12 col-sm-12 col-md-12">
                        {{--<a href="{{ route('export.file',['type'=>'xls']) }}">Download Excel xls</a> |--}}
                        {{--<a href="{{ route('export.file',['type'=>'xlsx']) }}">Download Excel xlsx</a> |--}}
                        {{--<a href="{{ route('export.file',['type'=>'csv']) }}">Download CSV</a>--}}
                    </div>
                </div>
                <form action="{{ route('import.mass') }}" method="POST" enctype="multipart/form-data">
                    <div class="row">
                        <div class="col-xs-12 col-sm-12 col-md-12">
                            <div class="form-group">
                                <label class="col-md-3">Select File to Import:</label>
                                <div class="col-md-9">
                                    <input type="file" class="form-control" name="mass_file" id="mass_file" />
{{--                                    {!! $errors->first('sample_file', '<p class="alert alert-danger">:message</p>') !!}--}}
                                </div>
                            </div>
                        </div>
                        <div class="col-xs-12 col-sm-12 col-md-12 text-center">
                            <button type="submit" class="btn btn-primary" >Upload</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection