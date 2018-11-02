var canBeBoughtWithMetaMask = true;
var canBeBoughtWithAccount = true;
var fromAddress = '';
var sellPrice = '';
var athleteId = '';
$(document).ready(function(){

    $('#btn_athlete_buy').attr('disabled', true);

    window.setTimeout(function(){
        Athlete.getMetamaskWalletAddress(function(address){
            $('#wallet_id').html(address);
            fromAddress = address;
            Athlete.getBalance(address, function(balance){
                balance = parseFloat(balance);
                $('#wallet_balance').html(balance+'ETH');
                var athlete_price = parseFloat($('#price').html());
                if ( athlete_price > balance ) {
                    canBeBoughtWithMetaMask = false;
                    $('#label_metamask').addClass('wrap-disabled');
                    $('#chk_metamask').attr('disabled', true);
                    $('#chk_metamask').attr('checked', false);
                    $('#chk_account').attr('checked', true);
                    //$('#span_chk_metamask').addClass('span-check-hidden');
                }
                else {
                    canBeBoughtWithMetaMask = true;
                    //$('#span_chk_metamask').removeClass('span-check-hidden');
                    $('#btn_athlete_buy').attr('disabled', false);
                }
            });
        });
        Athlete.getBalance($('#account_wallet_id').html(), function(_balance){
            $('#account_wallet_balance').html(_balance+'ETH');
            balance = parseFloat(_balance);
            var athlete_price = parseFloat($('#price').html());
            if ( athlete_price > balance ) {
                canBeBoughtWithAccount = false;
                $('#price').addClass('danger-color');
                $('#label_account').addClass('wrap-disabled');
                $('#chk_metamask').attr('checked', true);
                $('#chk_account').attr('checked', false);
                //$('#span_chk_account').addClass('span-check-hidden');
            }
            else {
                canBeBoughtWithAccount = true;
                //$('#span_chk_account').removeClass('span-check-hidden');
                $('#btn_athlete_buy').attr('disabled', false);
            }
        });
    }, 3500);
    $('#btn_athlete_buy').click(doOnBuyContract);
});

function showDialog(captionStr, bodyStr) {
    $('#alertmodal_title').html(captionStr);
    $('#alertmodal_body').html(bodyStr);
    $('#alertModal').modal('show');
}
function setHeader(xhr) {
    xhr.setRequestHeader('Access-Control-Request-Headers', '');
}

function doOnBuyContract() {

    if ( canBeBoughtWithAccount == false && canBeBoughtWithMetaMask == false ) {
        showDialog("CryptoFantasy", "Sorry, you do not have enough ETH to purchase this Athlete.");
        return;
    }

    //window.location.href = '/pending';

    $('#confirmModal').modal('show');
}
function doOnBuy(){
    $('#confirmModal').modal('hide');
    selected_chk = $('input[name="radio"]:checked').attr('id');
    $('input[name="buy_method"]').val(selected_chk);

    $('#buy_contract_form').submit();

    tokenId = $('input[name="tokenId"]').val();
    athleteId = $('input[name="athleteId"]').val();
    sellPrice = $('#price').html();

    if ( selected_chk == 'chk_metamask' ) {

        //showDialog("CryptoFantasy", "Purchase is now pending and will be completed shortly.");
        Athlete.purchaseEx(tokenId, {from: fromAddress, value:sellPrice, athleteId: athleteId }, function(receipt){
            $('#alertmodal_title').html("CryptoFantasy");
            $('#confirmModal').modal('show');
        });
    }
    else {   // use account wallet address
        address = $('#account_wallet_id').html();
        var options = { address: address, privatekey: private_key, gasPrice: gasPrice+"0000000000", gas: gasLimit };
        Athlete.purchaseExWithoutMetamask( tokenId, sellPrice, options, function(resp){
            if ( resp.result == 'fail' ) {
                showDialog("CryptoFantasy", "Error occurs while purchsing.");
            }
            else {
                $('#alertmodal_title').html("CryptoFantasy");
                $('#confirmModal').modal('show');
            }
        });
    }
}
function doOnBuyConfirm() {
    $('#confirmModal').modal('hide');
    $.get('/buycontract/'+athleteId, { price: sellPrice }, function(resp){
        window.location.href=window.origin+'/dashboard';
    });
}