$(document).ready(function(){
    $('#label_balance').html('loading...');
    $('#wallet_id').val('loading...');
    window.setTimeout(function() {
        Athlete.getMetamaskWalletAddress(function (address) {
            $('#wallet_id').val(address);
            $('#wallet_title').html(address);
            makeCode();
            Athlete.getBalance(address, function(balance){
                balance = parseFloat(balance);
                $('#label_balance').html(balance+'ETH');
            });
        });
        $('#label_account_balance').html('loading...');
        Athlete.getBalance($('#account_wallet_id').val(), function(_balance) {
            $('#label_account_balance').html(_balance+'ETH');
        });
    }, 2000);
    //$.getJSON(_blockchainServer+'/balance', {address: $('#account_wallet_id').val()}, function(resp){
    //    $('#label_account_balance').html(resp.balance+'ETH');
    //});
    $('#span_copy_address').click(function(){
        doOnCopyAddrToClipboard();
    });
    $('#span_copy_account_address').click(function(){
        doOnCopyAccountAddrToClipboard();
    });
    var qrcode = new QRCode(document.getElementById("qrcode"), {
        width : 300,
        height : 300
    });
    function makeCode () {
        var elText = document.getElementById("wallet_id");
        if (!elText.value) {
            alert("Input a text");
            elText.focus();
            return;
        }
        qrcode.makeCode(elText.value);
    }
    var qrcodeAccount = new QRCode(document.getElementById("qrcodeforaccount"), {
        width : 300,
        height : 300
    });
    function makeCodeAccount () {
        var elText = document.getElementById("account_wallet_id");
        if (!elText.value) {
            alert("Input a text");
            elText.focus();
            return;
        }
        qrcodeAccount.makeCode(elText.value);
    }

    makeCodeAccount();

    $('#span_username_edit_start').click(function(){
        $('#span_username_edit_save').removeClass('invisible');
        $('#span_username_edit_start').addClass('invisible');
        $('#username').attr('readonly', false);
        $('#username').focus();
    });
    $('#span_username_edit_save').click(function(){
        $('#span_username_edit_start').removeClass('invisible');
        $('#span_username_edit_save').addClass('invisible');
        $('#username').attr('readonly', true);
        $('form.form-horizontal').submit();
    });
});

function doOnCopyAddrToClipboard() {
    var Elem = document.getElementById('wallet_id');
    copyExec(Elem);
}
function doOnCopyAccountAddrToClipboard() {
    //var Elem = $('#account_wallet_id');
    var Elem = document.getElementById('account_wallet_id');
    copyExec(Elem);
}
function copyExec(Elem) {

    var isiOSDevice = navigator.userAgent.match(/ipad|iphone/i);
    if (isiOSDevice) {
        var editable = Elem.contentEditable;
        var readOnly = Elem.readOnly;
        Elem.contentEditable = true;
        Elem.readOnly = false;
        var range = document.createRange();
        range.selectNodeContents(Elem);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        Elem.setSelectionRange(0, 999999);
        Elem.contentEditable = editable;
        Elem.readOnly = readOnly;
    }
    else {
        Elem.select();
    }

    //Elem.select();

    document.execCommand("Copy");
}