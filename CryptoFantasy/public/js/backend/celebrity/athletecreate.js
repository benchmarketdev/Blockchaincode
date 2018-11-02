var contractAddress='';
var adminAddress='';
var adminProvateKey='';
var wallet;
var trArr;
$(document).ready(function(){
    $('#create_athlete_contract').click(doOnCreateAthlete);
    $('#remove_all_athlete_contract').click(doOnRemoveAllAthlete);
    if ( provider.provider == 'test' ){
        contractAddress = provider.test_contract_address;
        adminAddress = provider.test_admin_address;
        adminPrivateKey = provider.test_admin_privatekey;
    }
    else{
        contractAddress = provider.main_contract_address;
        adminAddress = provider.main_admin_address;
        adminPrivateKey = provider.main_admin_privatekey;
    }


});
var athlete_no = 0;
doOnRemoveAllAthlete = function() {
    $.get('/admin/removeallathlete', function(resp){
        $('#alertmodal_title').html('Crypto Fantasy');
        $('#alertmodal_body').html('Just removed all athlete contracts.');
        $('#alertmodal_footer_cancel').html('OK');
        $('#alertModal').modal({show: true});

        window.location.reload();
    });
}
doOnCreateAthlete = function() {
    var misAthletes = [];
    trArr = $("#athlete_list").children("tbody")[0].children;
    athlete_count = parseInt($('input[name="athlete_count"]').val());
    athlete_no = 0;
    _createAthletes();
}

function _createAthletes(){

    $trObj = $(trArr[athlete_no]).children();
    athleteId = $(trArr[athlete_no]).attr('athleteid');
    tokenId = parseFloat($('#transactions_'+athleteId).html());
    if ( isNaN(tokenId) ) {
        originWalletId = $trObj[5].innerText;
        sellPrice = parseFloat($trObj[6].innerText);
        actualFee = parseFloat($trObj[7].innerText);
        siteFee = parseFloat($trObj[8].innerText);

        $('#progress_'+athleteId).removeClass('invisible');
        athleteInfo = {athleteId: athleteId, originWalletId: originWalletId, actualFee: actualFee, siteFee: siteFee, sellPrice:sellPrice};
        options = {gasPrice: gasPrice+"0000000000", gas: gasLimit};
        Athlete.createNewAthleteCardWithoutMetamask(athleteId, originWalletId, actualFee, siteFee, sellPrice, options, function(resp){
            if ( resp.status == 'success' ) {
                $('#progress_'+athleteId).addClass('invisible');
                $('#transactions_'+athleteId).html(resp.tokenId);
                $.getJSON('/api/v1/public/setathletetokenid/'+athleteId, {token_id: resp.tokenId }, function(resp){

                });
            }
            else{
                $('#progress_'+athleteId).addClass('invisible');
                $('#transactions_'+athleteId).html('<span style="color:red;">FAIL</span>');
            }
            athlete_no++;
            if(athlete_no < athlete_count){
                _createAthletes();
            }
        });
    }
    else{
        athlete_no++;
        if(athlete_no < athlete_count){
            _createAthletes();
        }
    }
}

function _a(){
    Athlete.eth.accounts().then(function(accounts) {
        if (accounts.length > 0 && accounts[0] != undefined && accounts[0] != '') {
            wallet = accounts[0];
            console.log(wallet);
            $.tbody = $($('#example')[0].children[1])[0];
            console.log(Athlete.AthleteContractInstance);
            var _pos = 0;
            //while( _pos < athlete_count ){
            var athleteId = $($.tbody.rows[_pos]).attr('athleteId');
            var actualAddress = $($.tbody.rows[_pos])[0].cells[5].textContent;
            var _sellPrice = parseFloat($($.tbody.rows[_pos])[0].cells[6].textContent);
            var actualFee = parseFloat($($.tbody.rows[_pos])[0].cells[7].textContent);
            var siteFee = parseFloat($($.tbody.rows[_pos])[0].cells[8].textContent);
            var sellPrice = Athlete.utils.toWei(_sellPrice.toString());
            $('#progress_'+athleteId).removeClass('invisible');
            //Athlete.AthleteContractInstance.methods.createContractOfAthlete(athleteId, actualAddress, actualFee, siteFee, sellPrice).send({ from: wallet })
            ////.on('transactionHash', function(hash){
            ////    console.log("transactionHash", hash);
            ////    //self.eth.getBlockTransactionCount(hash).then(console.log);
            ////})
            ////.on('confirmation', function(confirmationNumber, receipt){
            //    //$.get('/api/v1/public/setathletetokenid/'+athleteId, { token_id: receipt.events.Birth.returnValues.tokenId,
            //    //                                                      txHash: receipt.transactionHash, transactions: confirmationNumber,
            //    //                                                      owner: receipt.events.Birth.returnValues.owner }, function(resp){
            //    //    console.log(resp);
            //    //});
            ////    console.log('confirmation', confirmationNumber, receipt);
            ////})
            //.on('receipt', function(receipt){
            //    // receipt example
            //    $.get('/api/v1/public/setathletetokenid/'+athleteId, { token_id: receipt.events.Birth.returnValues.tokenId, txHash: receipt.transactionHash}, function(resp){
            //        if (resp == 'ok'){
            //            _pos++;
            //        }
            //    });
            //})
            //.on('error', function(error){
            //    console.log(resp);
            //    misAthletes.push(athleteId);
            //    _pos++;
            //});
            //_pos++;
            //}
        }
    });


}