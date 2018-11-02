var selectedAthleteId = undefined;
$(document).ready(function(){
    $('.athlete-card').click(function(){
        athleteId = $(this).attr('athlete-id');
        if ( athleteId != 'not-allowed' ) {
            selectedAthleteId = athleteId;
            //window.location.href = '/myathlete/' + athleteId;
        }
    });
});

doOnClickAthlete = function(obj) {
    $('.celebrity-card').removeClass('athlete-active');
    $($(obj)[0].parentElement).addClass('athlete-active');

    athlete_id = $(obj).attr('athlete_id');
    athlete_price = $(obj).attr('purchase_price');
    price = $(obj).attr('price');

    var _min = athlete_price*1/2;
    var _max = athlete_price*1*2;
    $('input[name="athlete_id"]').val(athlete_id);
    $('#input_price').val(price);
    $('#min_price').html(_min);
    $('#max_price').html(_max);
    $('#slider_price').attr('min', _min);
    $('#slider_price').attr('max', _max);
    $('#slider_price').val(price);
}
showVal = function(value) {
    $('#input_price').val(value);
}