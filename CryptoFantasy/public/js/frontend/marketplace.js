$(document).ready(function(){
    $('.celebrity-card').click();
    $('input[name="search"]').on('keyup', function(ev){
        if (ev.keyCode == 13){
            var searchStr = $(this).val();
        }
    });
    $('.athlete-card').click(function(event){
        athleteId = $(this).attr('athlete-id');
        if ( athleteId != 'not-allowed' ) {

            $.ajax('/checkownerofathlete/'+athleteId)
            .done(function(resp){
                if (resp == 'false') {

                    if ( event.target.nodeName.toLowerCase() == 'a' ) {
                        strWarning = "You already own this contract. Please see it in your Dashboard section.";
                        showDialog("CryptoFantasy", strWarning);
                        return;
                    }
                    else {
                        window.location.href='/myathlete/'+athleteId;
                        //window.location.href='/dashboard';
                    }
                }
                else {
                    if ( event.target.nodeName.toLowerCase() == 'a' ) {
                        if ( $(event.target).attr('href') != undefined ) {
                            window.open($(event.target).attr('href'), '_blank');
                            //window.location.href = $(event.target).attr('href');
                        }
                        if ( $(event.target)[0].className == "btn-bottom-athlete" ) {
                            window.location.href = $(event.target).attr('a-href');
                        }
                    }
                    else
                        window.location.href='/athlete/'+athleteId;
                }
            })
            .fail(function(){
                window.location.href='/athlete/'+athleteId;
                //window.location.href=window.origin+'/login';
            });
            //$.get('/checkownerofathlete/'+athleteId, function(resp){
            //    if (resp == 'false')
            //        window.location.href=window.origin+'/dashboard';
            //    else
            //        window.location.href=window.origin+'/athlete/'+athleteId;
            //});
        }
    });
});
function showDialog(captionStr, bodyStr) {
    $('#alertmodal_title').html(captionStr);
    $('#alertmodal_body').html(bodyStr);
    $('#alertModal').modal('show');
}