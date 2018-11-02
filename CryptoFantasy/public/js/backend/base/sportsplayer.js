var selectedTeamId = undefined;
$(document).ready(function(){
    $('#btn_add_player').click(doOnClickAddNew);
});
doOnClickAddNew = function() {
    if ( selectedTeamId == undefined ) return;
    $('input[name="team_id"]').val(selectedTeamId);
    post_data = $('form[class="form-horizontal"]').serialize();
    $.post('/admin/storesportsplayer', post_data, function(resp){
        doOnLoadTeamPlayers();

    });
}
doOnTeamClick = function(obj) {
    selectedTeamId = $(obj).attr('id');
    doOnLoadTeamPlayers();
}
doOnLoadTeamPlayers = function() {
    $.get('/admin/getplayerinfo/'+selectedTeamId, function(resp){
        $('#tbody_content').empty();
        $('#tbody_content').html('<tr><td colspan="4">No Data</td></tr>');
        trHtml = '';
        no = 0;
        sports_type_id = resp.sports_type_id;
        $('select[name="sports_type_id"]').val(sports_type_id);
        if (resp.length>0) {
            for (i in resp) {
                data = resp[i];
                trHtml += '<tr>\
                            <td>' + (++no) + '</td>\
                            <td>' + data.player_name + '</td>\
                            <td>\
                                <a class="fa fa-edit" onclick="doOnEdit(\'' + data.player_name + '\', \'' + data._id + '\')">Edit</a>\
                            </td>\
                            <td>\
                                <a class="fa fa-times" style="color:#7F3434;" onclick="doOnDelete(\'' + data._id + '\')">Delete</a>\
                            </td>\
                        </tr>';
            }
            $('#tbody_content').html(trHtml);
        }
        $('input[name="player_name"]').val('');
    });
}
function doOnEdit(player_name, _id) {
    $('input[name="player_name"]').val(player_name);
    $('input[name="_id"]').val(_id);
}
function doOnDelete(id) {
    $.get('/admin/deletesportsplayer/'+id, function(resp){
        doOnLoadTeamPlayers();
    });
}