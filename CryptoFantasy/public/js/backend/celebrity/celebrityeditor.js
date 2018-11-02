var sports_player_id = undefined;
var selectedAthleteId = undefined;
var athleteInfo={};
$(document).ready(function(){
    doOnResizeTreeView();
    $(window).resize(function(){
        doOnResizeTreeView();
    });
    $('#submit_gasmodal').click(function(){
        var gasPrice = $('#gasprice').val();
        var gasLimit = $('#gaslimit').val();
        post_param = {athleteInfo: athleteInfo, gasPrice: gasPrice+"0000000000", gas: gasLimit};
        $('#gasModal').modal('hide');
        $.get(blockchainServer+"/createcontractofathlete", post_param, function(resp){
            if ( resp.result != 'FAIL' ) {
                tokenId = resp.tokenId;
                txHash = resp.txHash;
                $.getJSON('/api/v1/public/setathletetokenid/'+athleteInfo.athleteId, {token_id: tokenId, txHash: txHash }, function(resp){

                });
            }
            else{
                $('#alertmodal_title').html('Warning');
                $('#alertmodal_body').html('Token Registraion Action Fail');
                $('#alertmodal_footer_cancel').html('OK');
                $('#alertModal').modal({show: true});
            }
        });
    });
console.log(tree_data);
    var treeView = $("#treeview").dxTreeView({
        items: tree_data,
        //width: 500,
        searchEnabled: true,
        onItemClick: function(e){
            sports_player_id = e.node.key;
            doOnTeamClick();
        }
    }).dxTreeView("instance");

    /* When click on change profile pic */
    $('#btn_celebrity_store').click(doOnStoreCelebrityInfo);
    $('#btn_create_token').click(doOnCreateToken);

    $('#change-profile-pic').on('click', function(e){
        if ( sports_player_id == undefined ) {
            $('#alertmodal_title').html('Alert');
            $('#alertmodal_body').html('Please choice player.I just didn\'t choice player.');
            $('#alertmodal_footer_cancel').html('OK');
            $('#alertModal').modal({show: true});
        }
        else {
            $('#profile_pic_modal').modal({show:true});
        }
    });
    $('#profile-pic').on('change', function()	{
        $("#preview-profile-pic").html('');
        $("#preview-profile-pic").html('Uploading....');
        $("#cropimage").ajaxForm(
            {
                target: '#preview-profile-pic',
                success:    function() {
                    $('img#photo').imgAreaSelect({
                        aspectRatio: '1:1',
                        onSelectEnd: getSizes,
                    });
                    $('#image_name').val($('#photo').attr('file-name'));
                }
            }).submit();

    });
    /* handle functionality when click crop button  */
    $('#save_crop').on('click', function(e){
        e.preventDefault();
        params = {
            targetUrl: '/admin/cropimage?action=save',
            action: 'save',
            x_axis: $('#hdn-x1-axis').val(),
            y_axis : $('#hdn-y1-axis').val(),
            x2_axis: $('#hdn-x2-axis').val(),
            y2_axis : $('#hdn-y2-axis').val(),
            thumb_width : $('#hdn-thumb-width').val(),
            thumb_height:$('#hdn-thumb-height').val()
        };
        saveCropImage(params);
    });
    /* Function to get images size */
    function getSizes(img, obj){
        var x_axis = obj.x1;
        var x2_axis = obj.x2;
        var y_axis = obj.y1;
        var y2_axis = obj.y2;
        var thumb_width = obj.width;
        var thumb_height = obj.height;
        if(thumb_width > 0) {
            $('#hdn-x1-axis').val(x_axis);
            $('#hdn-y1-axis').val(y_axis);
            $('#hdn-x2-axis').val(x2_axis);
            $('#hdn-y2-axis').val(y2_axis);
            $('#hdn-thumb-width').val(thumb_width);
            $('#hdn-thumb-height').val(thumb_height);
        } else {
            alert("Please select portion..!");
        }
    }
    /* Function to save crop images */
    function saveCropImage(params) {
        $.ajax({
            url: params['targetUrl'],
            cache: false,
            dataType: "html",
            data: {
                action: params['action'],
                id: $('#sports_player_id').val(),
                t: 'ajax',
                w1:params['thumb_width'],
                x1:params['x_axis'],
                h1:params['thumb_height'],
                y1:params['y_axis'],
                x2:params['x2_axis'],
                y2:params['y2_axis'],
                image_name :$('#image_name').val()
            },
            type: 'Post',
            success: function (response) {
                $('#profile_pic_modal').modal('hide');
                $(".imgareaselect-border1,.imgareaselect-border2,.imgareaselect-border3,.imgareaselect-border4,.imgareaselect-border2,.imgareaselect-outer").css('display', 'none');

                $("#profile_picture").attr('src', response);
                $("#preview-profile-pic").html('');
                $("#profile-pic").val();

                $('#sports_player_id').val('');
                $('#hdn-x1-axis').val('');
                $('#hdn-y1-axis').val('');
                $('#hdn-x2-axis').val('');
                $('#hdn-y2-axis').val('');
                $('#hdn-thumb-width').val('');
                $('#hdn-thumb-height').val('');
                $('#action').val('');
                $('#image_name').val('');

                window.location.reload();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert('status Code:' + xhr.status + 'Error Message :' + thrownError);
            }
        });
    }
});
doOnResizeTreeView = function() {
    var _height = $(window)[0].innerHeight*1 - 155;
    $('#treeview').css('height', _height);
    $('#athlete_body').css('height', _height);
}
doOnTeamClick = function() {
    $('#sports_player_id').val(sports_player_id);
    $('#summernote').summernote('code', '');
    $.get('/admin/getcelebrityinfo/'+sports_player_id, function(resp){
        if ( resp.result == 'success' ) {
            //console.log(resp.data);
            $("#profile_picture").attr('src', resp.data.avatar);
            $('#player_name').html(resp.data.player_name);
            $('input[name="price"]').val(resp.data.price);
            $('input[name="origin_wallet_id"]').val(resp.data.origin_wallet_id);
            $('input[name="send_fee"]').val(resp.data.send_fee);
            $('input[name="site_fee"]').val(resp.data.site_fee);
            $('#summernote').summernote('code', resp.data.mass||'');
            selectedAthleteId = resp.data._id;

            //$('#is_published').val( resp.data.is_published );
            if (resp.data.is_published==1) $('#is_published').prop('checked', true); else $('#is_published').prop('checked', false);
        }
        else{
            $("#profile_picture").attr('src', '../images/default.jpg');
            $('#player_name').html('Unnamed');
            $('input[name="price"]').val('');
            $('input[name="origin_wallet_id"]').val('');
            $('input[name="send_fee"]').val('');
            $('#summernote').summernote('code', '');
            $('#is_published').removeAttr('checked');

            selectedAthleteId = undefined;
        }
    });
}

function doOnCreateToken() {
    if ( selectedAthleteId == undefined ) {
        $('#alertmodal_title').html('Alert');
        $('#alertmodal_body').html('Please choice player.I just didn\'t choice player.');
        $('#alertmodal_footer_cancel').html('OK');
        $('#alertModal').modal({show: true});
    }
    else {
        //$('#gasModal').modal({show:true});
        var athleteId = selectedAthleteId;
        var sellPrice = $('input[name="price"]').val();
        var originWalletId = $('input[name="origin_wallet_id"]').val();
        var siteFee = $('input[name="site_fee"]').val()*1;
        var actualFee = $('input[name="send_fee"]').val()*1;

        athleteInfo = {athleteId: athleteId, originWalletId: originWalletId, actualFee: actualFee, siteFee: siteFee, sellPrice:sellPrice};
        post_param = {athleteInfo: athleteInfo, gasPrice: gasPrice+"0000000000", gas: gasLimit};
        //$('#gasModal').modal('hide');
        //Athlete.createNewAthlete(athleteId, originWalletId, actualFee, siteFee, sellPrice);
        $.get(blockchainServer+"/createcontractofathlete", post_param, function(resp){
            if ( resp.result != 'FAIL' ) {
                tokenId = resp.tokenId*1-1;
                txHash = resp.txHash;
                //$.get(blockchainServer+"/getAthlete?tokenId="+tokenId, function(athlete_contract_info){
                    $.getJSON('/api/v1/public/setathletetokenid/'+resp.athleteId, {token_id: tokenId }, function(resp){

                    });
                //});
            }
            else{
                $('#alertmodal_title').html('Warning');
                $('#alertmodal_body').html('Token Registraion Action Fail');
                $('#alertmodal_footer_cancel').html('OK');
                $('#alertModal').modal({show: true});
            }
        });

    }
    if (selectedAthleteId == undefined) return;

}
doOnStoreCelebrityInfo = function() {
    if ( sports_player_id == undefined ) {
        $('#alertmodal_title').html('Alert');
        $('#alertmodal_body').html('Please choice player.I just didn\'t choice player.');
        $('#alertmodal_footer_cancel').html('OK');
        $('#alertModal').modal({show: true});
    }
    else {
        var send_fee = $('input[name="send_fee"]').val()*1;
        if ( send_fee > 10 ) {
            alertModal('Alert', 'You can not enter send fee value greater than 10.');
            $('input[name="send_fee"]').val('');
            $('input[name="send_fee"]').focus();
            return;
        }
        data = $('form[role="form"]').serialize();
        var mass_data = $('#summernote').summernote('code');

        $.post('/admin/setcelebritydetailinfo/'+sports_player_id+'?'+data, {mass: mass_data},  function(resp){
            if ( resp == 'ok' ) {
                $('#alertmodal_title').html('Alert');
                $('#alertmodal_body').html('Just stored detail information.');
                $('#alertmodal_footer_cancel').html('OK');
                $('#alertModal').modal({show: true});
            }
        });
        console.log(data);
    }
}
