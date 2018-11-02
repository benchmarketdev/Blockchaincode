$(document).ready(function(){

});
function doOnEdit(json_data) {
    $('input[name="sports_type"]').val(json_data.type_name);
    $('input[name="_id"]').val(json_data._id);
}
function doOnDelete(id) {
    $.get('/admin/deletesportstype/'+id, function(resp){
        window.location.reload();
    });
}