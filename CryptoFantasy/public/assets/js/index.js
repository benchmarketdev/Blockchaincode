$(document).ready(function(){
    
    $('.menu-item').click(function(){
    	$('.menu-item').removeClass('menu-item-sel');
    	$(this).addClass('menu-item-sel');

    	id = $(this).attr('id');
    	if(id == 'menu-item-template') {
    		$('.div_body').load('page-templates.html');
    	}
    })
	
});