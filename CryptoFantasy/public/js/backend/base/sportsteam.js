$(document).ready(function(){
    setTypeValue($('select[name="sports_type_id"]').val());
    $('select[name="sports_type_id"]').change(function(){
        setTypeValue($(this).val());

    });
});
function setTypeValue(type_id) {
    $('input[name="sports_type_id"]').val(type_id);
    $.get('/admin/editsportsteamdata/'+type_id, function(resp){
        $('#tbody_content').empty();
        trHtml = '';
        no = 0;
        sports_type_id = resp.sports_type_id;
        $('select[name="sports_type_id"]').val(sports_type_id);
        for( i in resp.data) {
            data = resp.data[i];
            trHtml += '<tr>\
                            <td>'+(++no)+'</td>\
                            <td>'+data.team_name+'</td>\
                            <td>\
                                <a class="fa fa-edit" onclick="doOnEdit(\''+data.team_name+'\', \''+data._id+'\')">Edit</a>\
                            </td>\
                            <td>\
                                <a class="fa fa-times" style="color:#7F3434;" onclick="doOnDelete(\''+data._id+'\')">Delete</a>\
                            </td>\
                        </tr>';
        }
        $('#tbody_content').html(trHtml);
    });
}
function doOnEdit(team_name, _id) {
    $('input[name="team_name"]').val(team_name);
    $('input[name="_id"]').val(_id);
}
function doOnDelete(id) {
    $.get('/admin/deletesportsteam/'+id, function(resp){
        window.location.reload();
    });
}