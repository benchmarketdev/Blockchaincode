<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Laravel') }}</title>

    <!-- Styles -->
    <link href="http://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&subset=all" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/font-awesome/css/font-awesome.min.css') }}" rel="stylesheet" type="text/css" />
    <link href="{{ asset('./assets/metronic/global/plugins/simple-line-icons/simple-line-icons.min.css') }}" rel="stylesheet" type="text/css" />

    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link href="{{ asset('css/frontend/home.css') }}" rel="stylesheet">
    <link href="{{ asset('css/frontend/marketplace.css') }}" rel="stylesheet">
    <link href="{{ asset('css/frontend/pending.css') }}" rel="stylesheet">
    <script src="{{ asset('theme/bower_components/jquery/jquery.min.js') }}"></script>

    <link rel="shortcut icon" href="{{ asset('./images/icon/logo.png') }}">
    <style>
        body{
            font-family: monospace, sans-serif;
        }

    </style>
    <script src="{{ asset('./js/Blockchain.js') }}" ></script>
</head>
<script>
    var account_wallet_id = '<?php echo $account_wallet_id; ?>';
    var private_key = '<?php echo str_replace('0x', '', $account_private_key); ?>';
    var gasPrice = '<?php echo config('app.gasPrice'); ?>';
    var gasLimit = '<?php echo config('app.gasLimit'); ?>';
    var tokenId = '<?php echo $athlete['token_id']; ?>';
    var athleteId = '<?php echo $athlete_id; ?>';
    Athlete.init();
</script>
<body>
<div id="alertModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title" id="alertmodal_title">Crypto Fantasy</h4>
            </div>
            <div class="modal-body" id="alertmodal_body">
                <p>Please choose one of metamask and account.</p>
            </div>
            <div class="modal-footer">
                <button type="button" id="alertmodal_footer_cancel" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>

    </div>
</div>
<div id="confirmModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title" id="confirm_modal_title">Crypto Fantasy</h4>
            </div>
            <div class="modal-body" id="confirm_modal_body">
                <p>Just completed.</p>
            </div>
            <div class="modal-footer">
                <button type="button" id="confirm_modal_footer_cancel" class="btn btn-default" onclick="doOnConfirmOkButtonClick()">Ok</button>
            </div>
        </div>

    </div>
</div>
<div id="app" class="app-body">
    <div class="crypto-container">
        <div class="col-xs-12 col-md-12 crypto-celebrity-container">
            <div class="py-4 container-fluid marketplace-container">
                <div class="div-page-wrap">
                    <h3 class="h-title">
                        Purchase Contract for {{ $athlete['price'] }}ETH?
                    </h3>
                    <div class="col-xs-12 col-sm-5 col-md-4">
                        <div class="img-comp-container">
                            <div class="img-comp-img">
                                @include('frontend.partial.athlete', ['athlete' => $athlete, 'provider' => $provider, 'contractAddress'=>$contractAddress, 'canBought'=>false, 'athlete_type'=>true])
                            </div>
                            <div class="img-comp-img img-comp-overlay">
                                @include('frontend.partial.athlete', ['athlete' => $athlete, 'provider' => $provider, 'contractAddress'=>$contractAddress, 'canBought'=>false, 'grey'=>true, 'athlete_type'=>true])
                            </div>
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-7 col-md-8" style="color:white;">

                        <form id="regForm" action="/action_page.php">
                            <div class="tab">
                                <h3>
                                    Please choose to purchase using MetaMask Wallet or this Account wallet.<br>
                                    Please make sure you transfer ETH to your Account wallet first if you choose to use your Account wallet.
                                </h3>
                                <div class="alert invisible" id="div_alert">
                                    {{--<span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>--}}
                                    <strong>Warning!</strong> MetMask not Installed or not logged-in. Please make sure MetaMask is installed and logged-in and refresh this browser again.
                                </div>
                                <div class="config-options">
                                    <ul>
                                        <li class="opt-gold">
                                            <input type="radio" name="group-name" id="input_metamask" value="metamask" />
                                            <label for="input_metamask">
                                                <div class="faux-checked" buy-method="metamask" id="div_metamask"></div>
                                                <div class="wallet-content" buy-method="metamask">
                                                    <span id="metamask_address"></span>
                                                    <span id="metamask_balance"></span>
                                                    <div class="loader" id="loader_metamask"></div>
                                                </div>
                                            </label>
                                        </li>
                                        <li class="opt-silver">
                                            <input type="radio" name="group-name" id="input_account" value="account"/>
                                            <label for="input_account" >
                                                <div class="faux-checked" buy-method="account" id="div_account"></div>
                                                <div class="wallet-content" buy-method="account">
                                                    <span id="account_address">{{ $account_wallet_id }}</span>
                                                    <span id="account_balance"></span>
                                                    <div class="loader" id="loader_account"></div>
                                                </div>
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div class="tab">
                                <div class="panel panel-default">
                                    <div class="panel-heading">
                                        <label class="lbl-title">
                                            Purchase is now pending and will be completed shortly.
                                        </label>
                                    </div>
                                    <div class="panel-body">
                                        <div class="row">
                                            <div class="col-md-12 text-center">
                                                {{--<div class="progressbar" data-perc="100">--}}
                                                    {{--<div class="bar"><span></span></div>--}}
                                                    {{--<div class="label"><span></span></div>--}}
                                                {{--</div>--}}
                                                <div>
                                                    <div id='kitt'>
                                                        <div class='one'></div>
                                                        <div class='two'></div>
                                                        <div class='three'></div>
                                                        <div class='four'></div>
                                                        <div class='five'></div>
                                                        <div class='six'></div>
                                                        <div class='seven'></div>
                                                        <div class='eight'></div>
                                                        <div class='nine'></div>
                                                        <div class='ten'></div>
                                                    </div>
                                                </div>

                                                <div class="preloader">
                                                    <div class="preloader-box">
                                                        <div>P</div>
                                                        <div>E</div>
                                                        <div>N</div>
                                                        <div>D</div>
                                                        <div>I</div>
                                                        <div>N</div>
                                                        <div>G</div>
                                                    </div>
                                                </div>

                                                <a id="a_txhash" href="https://{{ ($provider == 'test') ? 'ropsten.' : '' }}etherscan.io/tx/" target="_blank" ></a>
                                            </div>
                                        </div>
                                        <div class="row">
                                                <div class="div-error" id="div_error"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="overflow:auto;">
                                <div style="float:right;">
                                    <button type="button" id="prevBtn" onclick="nextPrev(-1)">Previous</button>
                                    <button type="button" id="nextBtn" onclick="nextPrev(1)" disabled>Next</button>
                                </div>
                            </div>
                            <!-- Circles which indicates the steps of the form: -->
                            <div style="text-align:center;margin-top:40px;">
                                <span class="step"></span>
                                <span class="step"></span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Scripts -->
<script src="{{ asset('js/app.js') }}"></script>
<script>
    var currentTab = 0; // Current tab is set to be the first tab (0)
    var direction = 'increase';
    var isClicked = false;
    var timeid;

    var athlete_price;
    var _balance;
    var isMobile = false; //initiate as false
    var _buyMethod = undefined;

    $(document).ready(function(){


        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
            isMobile = true;
        }
        $('body').css('height', ($(window)[0].innerHeight)+'px');
        $('.img-comp-overlay').css('opacity', 0);
        var $radios = $('input[name="group-name"]');
        $radios.change(function(){
            var $checked = $radios.filter(function() {
                return $(this).prop('checked');
            });
            _buyMethod = $checked.val();
            var _b = getWalletBalance(_buyMethod);
            if ( _buyMethod == 'metamask' && _b == 0 ) {
                $checked.prop('checked', false);
                $('#div_alert').removeClass('invisible');
                window.setTimeout(function(){
                    $('#div_alert').addClass('visible');
                }, 20000);
                _buyMethod = 'account';
                $('#input_account').prop('checked', true);
            }
            _balance = getWalletBalance(_buyMethod);
            athlete_price = parseFloat($('#lbl_sell_price').html());
        });

        window.setTimeout(function(){
            Athlete.getMetamaskWalletAddress(function(address){
                $('#metamask_address').html(address);
                if ( address.substring(0, 2) != '0x' ){
                    $('#div_alert').removeClass('invisible');
                }
                fromAddress = address;
                Athlete.getBalance(address, function(balance){
                    balance = parseFloat(balance);
                    $('#loader_metamask').addClass('invisible');
                    $('#metamask_balance').html(balance+'ETH');
                    var athlete_price = parseFloat($('#lbl_sell_price').html());
                    if ( athlete_price > balance ) {
                        canBeBoughtWithMetaMask = false;
                        $('#label_metamask').addClass('wrap-disabled');
                        $('#chk_metamask').attr('disabled', true);
                        $('#chk_metamask').attr('checked', false);
                        $('#chk_account').attr('checked', true);

                    }
                    else {
                        canBeBoughtWithMetaMask = true;
                        $('#btn_athlete_buy').attr('disabled', false);
                    }
                });
            });
            Athlete.getBalance($('#account_address').html(), function(_balance){
                $('#account_balance').html(_balance+'ETH');
                balance = parseFloat(_balance);
                var athlete_price = parseFloat($('#lbl_sell_price').html());
                $('#loader_account').addClass('invisible');
                if ( athlete_price > balance ) {
                    canBeBoughtWithAccount = false;
                    $('#price').addClass('danger-color');
                    $('#label_account').addClass('wrap-disabled');
                    $('#chk_metamask').attr('checked', true);
                    $('#chk_account').attr('checked', false);

                }
                else {
                    canBeBoughtWithAccount = true;
                    $('#nextBtn').prop('disabled', false);
                    $('#btn_athlete_buy').attr('disabled', false);
                }
            });
        }, 3500);
        showTab(currentTab); // Display the crurrent tab
    });

    function initComparisons() {
        $('.img-comp-overlay').css('opacity', 1);
        var x, i;
        x = document.getElementsByClassName("img-comp-overlay");
        for (i = 0; i < x.length; i++) {
            compareImages(x[i]);
        }
        function compareImages(img) {
            var slider, img, clicked = 0, w, h;
            w = img.offsetWidth;
            h = img.offsetHeight;
            img.style.height = "0px";
//            img.style.width = (w / 2) + "px";
            slider = document.createElement("DIV");
            slider.setAttribute("class", "img-comp-slider");
            img.parentElement.insertBefore(slider, img);
            slider.style.width = (w*1+30) + 'px' ; //(h / 2) - (slider.offsetHeight / 2) + "px";
            slider.style.top = '0px' ; //(h / 2) - (slider.offsetHeight / 2) + "px";
            //slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";
            timeid = setInterval(frame, 25);
            var pos = 0;
            function frame() {
                if (pos == h-2) {
                    direction = 'decrease';
                }
                if ( pos == 0 ){
                    direction = 'increase';
                }
                move(direction)
                function move(direct){
                    (direct == 'increase')?pos++:pos--;
                    slide(pos);
                }
            }
            function slide(x) {
                img.style.height = x + "px";
//                img.style.width = x + "px";
                slider.style.top = img.offsetHeight - (slider.offsetHeight / 2) + "px";
//                slider.style.left = img.offsetWidth - (slider.offsetWidth / 2) + "px";
            }
        }
    }
    function getWalletBalance(buy_method) {
        if ( buy_method == 'metamask' ) return parseFloat($('#metamask_balance').html());
        return parseFloat($('#account_balance').html());
    }
    function showTab(n) {
        var x = document.getElementsByClassName("tab");
        x[n].style.display = "block";
        if (n == 0) {
            document.getElementById("prevBtn").style.display = "none";
        } else {
            document.getElementById("prevBtn").style.display = "inline";
        }
        if (n == (x.length - 1)) {
            document.getElementById("prevBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "none";
        } else {
            document.getElementById("nextBtn").innerHTML = "Next";
        }
        fixStepIndicator(n)
    }

    function nextPrev(n) {
        var x = document.getElementsByClassName("tab");
        if ( currentTab == 0 && _buyMethod == undefined ) {
            $('#alertModal').modal('show');
            return;
        }
        x[currentTab].style.display = "none";
        currentTab = currentTab + n;
        if (currentTab >= x.length) {
            document.getElementById("regForm").submit();
            return false;
        }
        if ( currentTab == 1 ) {
            if ( _buyMethod == 'account' ) {
                address = $('#account_address').html();
                var options = { address: address, privatekey: private_key, gasPrice: gasPrice+"0000000000", gas: gasLimit };
                Athlete.purchaseExWithoutMetamask( tokenId, athlete_price, options, function(receipt){
                    procBlockchainResult(receipt);
                });
            }
            if ( _buyMethod == 'metamask' ) {
                Athlete.purchaseEx(tokenId, {from: fromAddress, value:athlete_price }, function(receipt){
                    procBlockchainResult(receipt);
                });
            }
        }
        showTab(currentTab);
    }
    function procBlockchainResult(receipt) {
        initComparisons();
        if ( receipt.result == 'hash' ) {
            $('#a_txhash').attr('href', $('#a_txhash').attr('href')+receipt.hash);
            $('#a_txhash').html(receipt.hash);
        }
        else if ( receipt.result == 'receipt' ) {
            if ( receipt.receipt.status == '0x1' ) {
                $.get('/buycontract/'+athleteId, { price: athlete_price }, function(resp){
                    if (resp == 'ok') {
                        $('#confirmModal').modal('show');
                    }
                });
            }
            else{
                $('#div_error').html("Error occurs while purchsing.<br>"+JSON.stringify(receipt.receipt));
            }
        }
        else {
            $('#div_error').html("Error occurs while purchsing.<br>"+JSON.stringify(receipt.error));
        }
    }
    function validateForm() {
        var x, y, i, valid = true;
        x = document.getElementsByClassName("tab");
        y = x[currentTab].getElementsByTagName("input");
        for (i = 0; i < y.length; i++) {
            if (y[i].value == "") {
                y[i].className += " invalid";
                valid = false;
            }
        }
        if (valid) {
            document.getElementsByClassName("step")[currentTab].className += " finish";
        }
        return valid; // return the valid status
    }
    function fixStepIndicator(n) {
        var i, x = document.getElementsByClassName("step");
        for (i = 0; i < x.length; i++) {
            x[i].className = x[i].className.replace(" active", "");
        }
        x[n].className += " active";
    }


    $(function() {

        $('.progressbar').each(function(){
            var t = $(this);
            var dataperc = t.attr('data-perc'),
                    barperc = Math.round(dataperc*5.56);
            t.find('.bar').animate({width:barperc}, dataperc*25);
            t.find('.label').append('<div class="perc"></div>');

            function perc() {
                var length = t.find('.bar').css('width'),
                        perc = Math.round(parseInt(length)/5.56),
                        labelpos = (parseInt(length)-2);
                t.find('.label').css('left', labelpos);
                t.find('.perc').text(perc+'%');
            }
            perc();
            setInterval(perc, 0);
        });
    });
    function doOnConfirmOkButtonClick() {
        window.location.href = '/dashboard';
    }
</script>
</body>
</html>
