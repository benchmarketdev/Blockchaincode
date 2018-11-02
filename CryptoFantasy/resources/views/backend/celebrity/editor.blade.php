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
</style>
    <script>
        var tree_data = <?php echo $tree_data; ?>;
        var gasPrice = '<?php echo config('app.gasPrice'); ?>';
        var gasLimit = '<?php echo config('app.gasLimit'); ?>';
    </script>
    <div class="row">
        <div class="col-xs-12 col-md-4 col-lg-3">
            <div class="portlet light bordered">
                <div class="portlet-title">
                    <div class="caption">
                        <label class="caption-subject font-blue-sharp bold uppercase" for="search_keyword">
                            <i class="icon-social-dribbble font-blue-sharp"></i>Team
                        </label>
                    </div>
                </div>
                <div class="portlet-body">
                    <div id="treeview"></div>
                </div>

            </div>
        </div>
        <div class="col-xs-12 col-md-8 col-lg-9">
            <div class="portlet light bordered">
                <div class="portlet-title">
                    <div class="caption">
                        <i class="fa fa-users font-blue-sharp"></i>
                        <span class="caption-subject font-blue-sharp bold uppercase">Celebrity</span>
                    </div>
                </div>
                <div class="portlet-body">
                    <div class="portlet light portlet-fit bordered padding0">
                        <div class="portlet-body padding0" style="padding:0;">
                            <div id="athlete_body" class="row crypto-row">
                                <div class="col-md-12 text-center padding0">
                                    <span id="player_name">Unnamed</span>
                                </div>
                                <div class="col-xs-12 col-sm-6 col-md-4 text-center padding0">
                                    <div class="row margin0">
                                        <div class="col-md-12 text-center padding0">
                                            <a type="button" class="btn blue btn-block btn-outline" id="change-profile-pic" style="float:right;">Change Athlete Picture</a>
                                        </div>
                                        <div class="col-md-12 text-center padding0">
                                            <img id="profile_picture" class="img-avatar" data-src="{{ asset('./images/default.jpg') }}" data-holder-rendered="true" src="{{ asset('./images/default.jpg') }}"/>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-6 col-md-8 padding0">
                                    <div class="row margin0">
                                        <div class="col-md-12">
                                            <form role="form">
                                                {{ csrf_field() }}
                                                <div class="form-body">
                                                    <div class="form-group form-md-line-input margin0 white-color">
                                                        <label for="price">Price(ETH)</label>
                                                        <input type="text" class="form-control input-cell white-color" name="price" aria-required="true" aria-invalid="false" aria-describedby="digits-error">
                                                    </div>
                                                    <div class="form-group form-md-line-input margin0 white-color">
                                                        <label for="price">Origin Wallet ID</label>
                                                        <input type="text" class="form-control input-cell white-color" name="origin_wallet_id">
                                                    </div>
                                                    <div class="col-xs-12 col-md-6 form-group form-md-line-input margin0 white-color padding0" style="padding-bottom:10px;padding-right:10px;">
                                                        <label for="price">Fee(%)</label>
                                                        <input type="text" class="form-control input-cell white-color" name="send_fee">
                                                    </div>
                                                    <div class="col-xs-12 col-md-6 form-group form-md-line-input margin0 white-color padding0" style="padding-bottom:10px;padding-left:10px;">
                                                        <label for="price">Site Fee(%)</label>
                                                        <input type="text" class="form-control input-cell white-color" name="site_fee" value="3">
                                                    </div>
                                                    <div class="col-md-12 form-group padding0">
                                                        <div name="mass" id="summernote" class="text-left"> </div>
                                                    </div>
                                                    <div class="col-md-12 form-group padding0">
                                                        <div class="md-checkbox">
                                                            <input type="checkbox" id="is_published" name="is_published"  class="md-check" >
                                                            <label for="is_published">
                                                                <span></span>
                                                                <span class="check"></span>
                                                                <span class="box"></span> Publish </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-6 form-group ">
                                                        <button type="button" id="btn_celebrity_store" class="btn blue btn-block btn-outline">Save</button>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-6 form-group ">
                                                        <button type="button" id="btn_create_token" class="btn blue btn-block btn-outline">Register Token</button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                    <form id="cropimage" method="post" enctype="multipart/form-data" action="{{ route('cropimage') }}">
                        {{ csrf_field() }}
                        <strong>Upload Image:</strong> <br><br>
                        <input type="file" name="profile-pic" id="profile-pic" />
                        <button type="button" id="save_crop" class="btn btn-primary">Crop & Save</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        <input type="hidden" name="sports_player_id" id="sports_player_id" value="1" />
                        <input type="hidden" name="hdn-x1-axis" id="hdn-x1-axis" value="" />
                        <input type="hidden" name="hdn-y1-axis" id="hdn-y1-axis" value="" />
                        <input type="hidden" name="hdn-x2-axis" value="" id="hdn-x2-axis" />
                        <input type="hidden" name="hdn-y2-axis" value="" id="hdn-y2-axis" />
                        <input type="hidden" name="hdn-thumb-width" id="hdn-thumb-width" value="" />
                        <input type="hidden" name="hdn-thumb-height" id="hdn-thumb-height" value="" />
                        <input type="hidden" name="action" value="" id="action" />
                        <input type="hidden" name="image_name" value="" id="image_name" />
                        <div id='preview-profile-pic'></div>
                        <div id="thumbs" style="padding:5px; width:600px"></div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('./js/backend/celebrity/celebrityeditor.js') }}" ></script>
@endsection