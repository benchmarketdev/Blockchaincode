@extends('backend.layouts.manager')
<style>
    .div-border {
        padding:10px;
        border: 3px solid grey;
        border-radius: 10px;
    }
    .div-selected {
        border-color: #38b44a;
    }
</style>
@section('content')
<script>
    var provider='{{ $provider['provider'] }}';
</script>
    <div class="row">
        <div class="col-md-12">
            <div class="panel panel-info">
                <div class="panel-heading">Eth provider</div>
                <div class="panel-body">
                    <form class="form-horizontal" method="POST" action="{{ route('store.provider') }}" role="form">
                        {{ csrf_field() }}
                        <div class="form-body" style="padding:10px;">
                            <div id="div_main_border" class="div-border">
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Main Provider</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="main_provider" value="{{ $provider['main_provider'] }}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Main Contract Address</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="main_contract_address" value="{{ $provider['main_contract_address'] }}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Main Admin Address</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="main_admin_address" value="{{ $provider['main_admin_address'] }}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Main Admin PrivateKey</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="main_admin_privatekey" value="{{ $provider['main_admin_privatekey'] }}">
                                    </div>
                                </div>
                            </div>
                            <div id="div_test_border" class="div-border" style="margin-top: 20px;">
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Test Provider</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="test_provider" value="{{ $provider['test_provider'] }}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Test Contract Address</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="test_contract_address" value="{{ $provider['test_contract_address'] }}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Test Admin Address</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="test_admin_address" value="{{ $provider['test_admin_address'] }}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 control-label">Test Admin PrivateKey</label>
                                    <div class="col-md-9">
                                        <input type="text" class="form-control input-sm" name="test_admin_privatekey" value="{{ $provider['test_admin_privatekey'] }}">
                                    </div>
                                </div>
                            </div>

                            <div class="form-group text-center">
                                <div class="mt-radio-inline">
                                    <div class="mt-radio-inline">
                                        <label class="mt-radio">
                                            <input type="radio" name="provider" id="test_provider" value="test"> Test mode
                                            <span></span>
                                        </label>
                                        <label class="mt-radio">
                                            <input type="radio" name="provider" id="main_provider" value="main"> Main mode
                                            <span></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="form-actions text-right">
                                <button type="submit" class="btn blue" >Submit</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
<script src="{{ asset('./js/backend/ethprovider.js') }}"></script>
@endsection
