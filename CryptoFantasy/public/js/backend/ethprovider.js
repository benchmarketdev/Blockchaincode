$(document).ready(function(){
    if ( provider == 'test' ) {
        $('#div_test_border').addClass('div-selected');
        $('#test_provider').attr('checked', true);
        $('#main_provider').attr('checked', false);
    }
    else {
        $('#div_main_border').addClass('div-selected');
        $('#main_provider').attr('checked', true);
        $('#test_provider').attr('checked', false);
    }
    $('#test_provider').click(function(){
        $('#div_test_border').addClass('div-selected');
        $('#div_main_border').removeClass('div-selected');
    });
    $('#main_provider').click(function(){
        $('#div_main_border').addClass('div-selected');
        $('#div_test_border').removeClass('div-selected');
    });
});