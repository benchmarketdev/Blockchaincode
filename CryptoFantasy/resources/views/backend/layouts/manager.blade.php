<!DOCTYPE html>
<!--[if IE 8]> <html lang="en" class="ie8 no-js"> <![endif]-->
<!--[if IE 9]> <html lang="en" class="ie9 no-js"> <![endif]-->
<html lang="en">
<head>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Laravel') }}</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <meta content="Preview page of Metronic Admin Theme #1 for statistics, charts, recent events and reports" name="description" />
    <meta content="" name="author" />
    <link href="http://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&subset=all" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/font-awesome/css/font-awesome.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/simple-line-icons/simple-line-icons.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/bootstrap/css/bootstrap.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/bootstrap-switch/css/bootstrap-switch.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/bootstrap-daterangepicker/daterangepicker.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/morris/morris.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/fullcalendar/fullcalendar.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/jqvmap/jqvmap/jqvmap.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/css/components.min.css') }}" rel="stylesheet" id="style_components" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/css/plugins.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/layouts/layout/css/layout.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/layouts/layout/css/themes/darkblue.min.css') }}" rel="stylesheet" type="text/css" id="style_color" />
    <link href="{{ asset('./assets/metronic/layouts/layout/css/custom.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/bootstrap-wysihtml5/bootstrap-wysihtml5.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/bootstrap-markdown/css/bootstrap-markdown.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/bootstrap-summernote/summernote.css') }}" rel="stylesheet" type="text/css" />

    <link href="{{ asset('./assets/metronic/global/plugins/jcrop/css/jquery.Jcrop.min.css') }}" rel="stylesheet" type="text/css" />
    <script src="{{ asset('./theme/bower_components/jquery/jquery.js') }}"></script>

    <script src="{{ asset('./js/Blockchain.js') }}" ></script>
    <link rel="shortcut icon" href="favicon.ico" /> </head>
<style>
    .logo-title {
        color: white;
        font-size: 18px;
        font-weight: bold;
        margin-top: 12px!important;
    }
</style>
<?php
    $route_name = Route::currentRouteName();
?>
<script>var blockchainServer='{{ config('app.blockchainserver') }}'</script>
<body class="page-header-fixed page-sidebar-closed-hide-logo page-content-white">
    <div class="page-wrapper">
        <div class="page-header navbar navbar-fixed-top">
            <div class="page-header-inner ">
                <div class="page-logo">
                    <a href="/">
                        <label class="logo-default logo-title" alt="logo">CryptoFantasy</label>
                        {{--                        <img src="{{ asset('./assets/metronic/layouts/layout/img/logo.png') }}" alt="logo" class="logo-default" />--}}
                    </a>
                    <div class="menu-toggler sidebar-toggler">
                        <span></span>
                    </div>
                </div>
                <a href="javascript:;" class="menu-toggler responsive-toggler" data-toggle="collapse" data-target=".navbar-collapse">
                    <span></span>
                </a>
                <div class="top-menu">
                    <ul class="nav navbar-nav pull-right">
                        <li class="dropdown dropdown-user">
                            <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown" data-hover="dropdown" data-close-others="true">
                                <span class="username username-hide-on-mobile">{{ Auth::user()->username }}</span>
                                <i class="fa fa-angle-down"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-default">
                                <li>
                                    <a href="{{ route('logout') }}"
                                       onclick="event.preventDefault();
                                                         document.getElementById('logout-form').submit();">
                                        <i class="icon-key"></i>
                                        Logout
                                    </a>

                                    <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                                        {{ csrf_field() }}
                                    </form>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="clearfix"> </div>
        <div class="page-container">
            <div class="page-sidebar-wrapper">
                <div class="page-sidebar navbar-collapse collapse">
                    <ul class="page-sidebar-menu  page-header-fixed " data-keep-expanded="false" data-auto-scroll="true" data-slide-speed="200" style="padding-top: 20px">
                        <li class="sidebar-toggler-wrapper hide">
                            <div class="sidebar-toggler">
                                <span></span>
                            </div>
                        </li>
                        <li class="nav-item">
                            <a href="javascript:;" class="nav-link nav-toggle">
                                <i class="icon-home"></i>
                                <span class="title">Dashboard</span>
                                <span class="selected"></span>
                                <span class="arrow"></span>
                            </a>
                            <ul class="sub-menu">
                                <li class="nav-item start active open">
                                    <a href="#" class="nav-link ">
                                        <i class="icon-bar-chart"></i>
                                        <span class="title">Dashboard 1</span>
                                        <span class="selected"></span>
                                    </a>
                                </li>
                                <li class="nav-item start ">
                                    <a href="#" class="nav-link ">
                                        <i class="icon-bulb"></i>
                                        <span class="title">Dashboard 2</span>
                                        <span class="badge badge-success">1</span>
                                    </a>
                                </li>
                                <li class="nav-item start ">
                                    <a href="#" class="nav-link ">
                                        <i class="icon-graph"></i>
                                        <span class="title">Dashboard 3</span>
                                        <span class="badge badge-danger">5</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <?php
                            $open = "";
                            $arrow_open = "";
                            if ( in_array($route_name, ['editsportstype', 'editsportsteam', 'showplayereditor', 'mass.import.view']) ) {
                                $open = "active open";
                                $arrow_open = "open";
                            }
                        ?>
                        <li class="nav-item {{$open}}">
                            <a href="javascript:;" class="nav-link nav-toggle">
                                <i class="fa fa-folder"></i>
                                <span class="title">Base Data</span>
                                <span class="selected"></span>
                                <span class="arrow {{ $arrow_open }}"></span>
                            </a>
                            <ul class="sub-menu">
                                <li class="nav-item {{ ($route_name == 'editsportstype') ? "active open": "" }}">
                                    <a href="{{ route('editsportstype') }}" class="nav-link ">
                                        <span class="title">Sports Type</span>
                                    </a>
                                </li>
                                <li class="nav-item {{ ($route_name == 'editsportsteam') ? "active open": "" }}">
                                    <a href="{{ route('editsportsteam') }}" class="nav-link ">
                                        <span class="title">Sports Team</span>
                                    </a>
                                </li>
                                <li class="nav-item {{ ($route_name == 'showplayereditor') ? "active open": "" }}">
                                    <a href="{{ route('showplayereditor') }}" class="nav-link ">
                                        <span class="title">Register Player</span>
                                    </a>
                                </li>
                                <li class="nav-item {{ ($route_name == 'mass.import.view') ? "active open": "" }}">
                                    <a href="{{ route('mass.import.view') }}" class="nav-link ">
                                        <span class="title">Import Mass Data</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li class="heading">
                            <h3 class="uppercase">Admin Management</h3>
                        </li>
                        <?php
                        $open = "";
                        $arrow_open = "";
                        if ( in_array($route_name, ['showcelebrityeditor']) ) {
                            $open = "active open";
                            $arrow_open = "open";
                        }
                        ?>
                        <li class="nav-item  {{ ($route_name == 'showcelebrityeditor') ? "active open": "" }}">
                            <a href="{{ route('showcelebrityeditor') }}" class="nav-link ">
                                <i class="icon-notebook"></i>
                                <span class="title">Celebrity Editor</span>
                            </a>
                        </li>
                        <li class="nav-item  {{ ($route_name == 'show.athlete.create') ? "active open": "" }}">
                            <a href="{{ route('show.athlete.create') }}" class="nav-link ">
                                <i class="icon-notebook"></i>
                                <span class="title">Athlete Create</span>
                            </a>
                        </li>
                        <li class="nav-item  {{ ($route_name == 'show.transaction.form') ? "active open": "" }}">
                            <a href="{{ route('show.transaction.form') }}" class="nav-link ">
                                <i class="icon-notebook"></i>
                                <span class="title">Transactions</span>
                            </a>
                        </li>
                        <li class="nav-item  {{ ($route_name == 'show.member.form') ? "active open": "" }}">
                            <a href="{{ route('show.member.form') }}" class="nav-link ">
                                <i class="icon-notebook"></i>
                                <span class="title">Member</span>
                            </a>
                        </li>
                        <li class="nav-item  {{ ($route_name == 'show.provider.form') ? "active open": "" }}">
                            <a href="{{ route('show.provider.form') }}" class="nav-link ">
                                <i class="icon-notebook"></i>
                                <span class="title">ETH Provider</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="page-content-wrapper">
                <!-- BEGIN CONTENT BODY -->
                <div class="page-content">
                    @yield('content')
                </div>
                <!-- END CONTENT BODY -->
            </div>
            <!-- END CONTENT -->

        </div>
        <!-- END CONTAINER -->
        <!-- BEGIN FOOTER -->
        <div class="page-footer text-center">
            <div class="page-footer-inner"> 2018 &copy; Crypto Fantasy
            </div>
            <div class="scroll-to-top">
                <i class="icon-arrow-up"></i>
            </div>
        </div>
        <!-- END FOOTER -->
    </div>


    <div id="alertModal" class="modal fade" role="dialog">
        <div class="modal-dialog">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title" id="alertmodal_title">Modal Header</h4>
                </div>
                <div class="modal-body" id="alertmodal_body">
                    <p>Some text in the modal.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" id="alertmodal_footer_cancel" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

        </div>
    </div>
    <div id="gasModal" class="modal fade" role="dialog">
        <div class="modal-dialog">
            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title" id="gasmodal_title">Please confirm GasPrice and GasLImit</h4>
                </div>
                <div class="modal-body" id="gasmodal_body">
                    <form class="form-horizontal" style="padding:20px;">
                        <div class="form-group">
                            <label for="gasprice" class="col-md-4">Gas Price(GWeis):</label>
                            <input type="number"  class="col-md-8 form-control" name="gasprice" id="gasprice" min="21" max="100" value="22">
                        </div>
                        <div class="form-group">
                            <label for="gaslimit" class="col-md-4">Gas Limit(Units):</label>
                            <input type="number"  class="col-md-8 form-control" name="gaslimit" id="gaslimit" min="200000" max="5000000" step="50000" value="3000000">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" id="submit_gasmodal">Submit</button>
                    <button type="button" id="gasmodal_footer_cancel" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

        </div>
    </div>
</body>
<!-- END QUICK NAV -->
<!--[if lt IE 9]>

<script src="{{ asset('./assets/metronic/global/plugins/respond.min.js') }}"></script>
<script src="{{ asset('./assets/metronic/global/plugins/excanvas.min.js') }}"></script>
<script src="{{ asset('./assets/metronic/global/plugins/ie8.fix.min.js') }}"></script>
<![endif]-->
<!-- BEGIN CORE PLUGINS -->
<script src="{{ asset('./assets/metronic/global/plugins/jquery.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/bootstrap/js/bootstrap.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/js.cookie.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/jquery-slimscroll/jquery.slimscroll.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/jquery.blockui.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/bootstrap-switch/js/bootstrap-switch.min.js') }}" type="text/javascript"></script>
<!-- END CORE PLUGINS -->
<!-- BEGIN PAGE LEVEL PLUGINS -->
<script src="{{ asset('./assets/metronic/global/plugins/moment.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/bootstrap-daterangepicker/daterangepicker.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/morris/morris.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/morris/raphael-min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/counterup/jquery.waypoints.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/counterup/jquery.counterup.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amcharts/amcharts.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amcharts/serial.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amcharts/pie.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amcharts/radar.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amcharts/themes/light.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amcharts/themes/patterns.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amcharts/themes/chalk.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/ammap/ammap.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/ammap/maps/js/worldLow.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/amcharts/amstockcharts/amstock.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/fullcalendar/fullcalendar.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/horizontal-timeline/horizontal-timeline.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/flot/jquery.flot.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/flot/jquery.flot.resize.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/flot/jquery.flot.categories.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/jquery-easypiechart/jquery.easypiechart.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/jquery.sparkline.min.js') }}" type="text/javascript"></script>

<script src="{{ asset('./assets/metronic/global/plugins/bootstrap-wysihtml5/wysihtml5-0.3.0.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/global/plugins/bootstrap-wysihtml5/bootstrap-wysihtml5.js') }}" type="text/javascript"></script>

<script src="{{ asset('./assets/metronic/global/plugins/bootstrap-markdown/lib/markdown.js') }}" type="text/javascript"></script>
{{--<script src="{{ asset('./assets/metronic./../assets/global/plugins/bootstrap-markdown/js/bootstrap-markdown.js') }}" type="text/javascript"></script>--}}
<script src="{{ asset('./assets/metronic/global/plugins/bootstrap-summernote/summernote.min.js') }}" type="text/javascript"></script>

<!-- END PAGE LEVEL PLUGINS -->
<!-- BEGIN THEME GLOBAL SCRIPTS -->
<script src="{{ asset('./assets/metronic/global/plugins/jstree/dist/jstree.min.js') }}" type="text/javascript"></script>

<script src="{{ asset('./assets/metronic/global/scripts/app.min.js') }}" type="text/javascript"></script>

<script src="{{ asset('./assets/metronic/pages/scripts/ui-tree.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/pages/scripts/components-editors.min.js') }}" type="text/javascript"></script>

<!-- END THEME GLOBAL SCRIPTS -->
<!-- BEGIN PAGE LEVEL SCRIPTS -->
<script src="{{ asset('./assets/metronic/pages/scripts/dashboard.min.js') }}" type="text/javascript"></script>
<!-- END PAGE LEVEL SCRIPTS -->
<!-- BEGIN THEME LAYOUT SCRIPTS -->
<script src="{{ asset('./assets/metronic/layouts/layout/scripts/layout.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/layouts/layout/scripts/demo.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/layouts/global/scripts/quick-sidebar.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/metronic/layouts/global/scripts/quick-nav.min.js') }}" type="text/javascript"></script>




<script src="https://cdn3.devexpress.com/jslib/17.2.5/js/dx.all.js"></script>
{{--<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs/dt-1.10.16/datatables.min.css"/>--}}
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.16/css/jquery.dataTables.min.css"/>
<script type="text/javascript" src="https://cdn.datatables.net/v/bs/dt-1.10.16/datatables.min.js"></script>

<script src="{{ asset('./assets/jcrop/dist_files/jquery.imgareaselect.js') }}" type="text/javascript"></script>
<script src="{{ asset('./assets/jcrop/dist_files/jquery.form.js') }}"></script>
<!-- END THEME LAYOUT SCRIPTS -->
<script>
    $(document).ready(function()
    {
        $('#clickmewow').click(function()
        {
            $('#radio1003').attr('checked', 'checked');
        });


    });
    function alertModal( title, content, okCaption ) {
        $('#alertmodal_title').html(title);
        $('#alertmodal_body').html(content);
        $('#alertmodal_footer_cancel').html(okCaption);
        $('#alertModal').modal({show: true});
    }

    Athlete.init();
</script>
</body>

</html>