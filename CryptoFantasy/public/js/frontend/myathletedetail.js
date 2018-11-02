$(document).ready(function(){
    doOnClickAthlete();
    changeReceiveEth(price);

    $('#btn_file_upload').click(doOnUpload);

    $('#form_change_price').css('width', (parseInt($('.athlete-card').width())+2)+'px');
    $('#form_change_price').css('margin', 'auto');
});

doOnClickAthlete = function() {
//console.log(athlete_id, price, athlete_price);
    var _min = athlete_price*1/2;
    var _max = athlete_price*1*2;
    $('input[name="athlete_id"]').val(athlete_id);
    $('#input_price').val(price);
    $('#lbl_sell_price').html(price);
    $('#min_price').html(_min);
    $('#max_price').html(_max);
    $('#slider_price').attr('min', _min);
    $('#slider_price').attr('max', _max);
    $('#slider_price').val(price);
}
showVal = function(value) {
    $('#input_price').val(value);
    $('#lbl_sell_price').html(value);
    $('#a_price').html(value);
    changeReceiveEth(value);
}
changeReceiveEth = function(_price) {
    var new_price = _price*(1-(send_fee+site_fee)/100);
    $('#span_receive_eth').html(Math.round(new_price*100000)/100000);
}

/*****************************************  Avatar Editor Start *****************************************/
function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            $('#imagePreview').css('background-image', 'url('+e.target.result +')');
            $('#imagePreview').hide();
            $('#imagePreview').fadeIn(650);
        }
        reader.readAsDataURL(input.files[0]);
        $('#btn_file_upload').css('display', '');
    }
}
$("#imageUpload").change(function() {
    readURL(this);
});
function doOnUpload() {
    if ( $('#imageUpload').get(0).files.length === 0 ) {
        showDialog('CryptoFantasy', "Sorry! Please choice image avatar.");
        return;
    }
    $('#upload_form').submit();
}
function showDialog(captionStr, bodyStr) {
    $('#alertmodal_title').html(captionStr);
    $('#alertmodal_body').html(bodyStr);
    $('#alertModal').modal('show');
}
/*****************************************  Avatar Editor  End  *****************************************/