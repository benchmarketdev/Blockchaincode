<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ config('app.name', 'Laravel') }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Charisma, a fully featured, responsive, HTML5, Bootstrap admin template.">
    <meta name="author" content="Muhammad Usman">

    <!-- The styles -->
    <link href="{{ asset('theme/css/bootstrap-cerulean.min.css') }}" rel="stylesheet" id="bs-css">

    <link href="theme/css/charisma-app.css" rel="stylesheet">
    <link href='theme/bower_components/fullcalendar/dist/fullcalendar.css' rel='stylesheet'>
    <link href='theme/bower_components/fullcalendar/dist/fullcalendar.print.css' rel='stylesheet' media='print'>
    <link href='theme/bower_components/chosen/chosen.min.css' rel='stylesheet'>
    <link href='theme/bower_components/colorbox/example3/colorbox.css' rel='stylesheet'>
    <link href='theme/bower_components/responsive-tables/responsive-tables.css' rel='stylesheet'>
    <link href='theme/bower_components/bootstrap-tour/build/css/bootstrap-tour.min.css' rel='stylesheet'>
    <link href='theme/css/jquery.noty.css' rel='stylesheet'>
    <link href='theme/css/noty_theme_default.css' rel='stylesheet'>
    <link href='theme/css/elfinder.min.css' rel='stylesheet'>
    <link href='theme/css/elfinder.theme.css' rel='stylesheet'>
    <link href='theme/css/jquery.iphone.toggle.css' rel='stylesheet'>
    <link href='theme/css/uploadify.css' rel='stylesheet'>
    <link href='theme/css/animate.min.css' rel='stylesheet'>

    <!-- jQuery -->
    <script src="theme/bower_components/jquery/jquery.min.js"></script>

    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link href="{{ asset('css/index.css') }}" rel="stylesheet">
    <link href="{{ asset('images/centra-logo.png') }}" rel="icon" />

    <!-- The HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- The fav icon -->
    <link rel="shortcut icon" href="images/centra-logo.png">

    <style>
        .form-control{
            background: transparent;
        }
    </style>
</head>

<body>
<div class="ch-container">
    @yield('content')

</div><!--/.fluid-container-->

<!-- external javascript -->

<script src="theme/bower_components/bootstrap/dist/js/bootstrap.min.js"></script>

<!-- library for cookie management -->
<script src="theme/js/jquery.cookie.js"></script>
<!-- calender plugin -->
<script src='theme/bower_components/moment/min/moment.min.js'></script>
<script src='theme/bower_components/fullcalendar/dist/fullcalendar.min.js'></script>
<!-- data table plugin -->
<script src='theme/js/jquery.dataTables.min.js'></script>

<!-- select or dropdown enhancer -->
<script src="theme/bower_components/chosen/chosen.jquery.min.js"></script>
<!-- plugin for gallery image view -->
<script src="theme/bower_components/colorbox/jquery.colorbox-min.js"></script>
<!-- notification plugin -->
<script src="theme/js/jquery.noty.js"></script>
<!-- library for making tables responsive -->
<script src="theme/bower_components/responsive-tables/responsive-tables.js"></script>
<!-- tour plugin -->
<script src="theme/bower_components/bootstrap-tour/build/js/bootstrap-tour.min.js"></script>
<!-- star rating plugin -->
<script src="theme/js/jquery.raty.min.js"></script>
<!-- for iOS style toggle switch -->
<script src="theme/js/jquery.iphone.toggle.js"></script>
<!-- autogrowing textarea plugin -->
<script src="theme/js/jquery.autogrow-textarea.js"></script>
<!-- multiple file upload plugin -->
<script src="theme/js/jquery.uploadify-3.1.min.js"></script>
<!-- history.js for cross-browser state change on ajax -->
<script src="theme/js/jquery.history.js"></script>
<!-- application script for Charisma demo -->
<script src="theme/js/charisma.js"></script>


</body>
</html>
