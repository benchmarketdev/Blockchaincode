$(document).ready(function(){

    $('input.auth-input').blur(function() {
        var $this = $(this);
        if ($this.val())
            $this.addClass('used');
        else
            $this.removeClass('used');
    });

    var $ripples = $('.ripples');

    $ripples.on('click.Ripples', function(e) {

        var $this = $(this);
        var $offset = $this.parent().offset();
        var $circle = $this.find('.ripplesCircle');

        var x = e.pageX - $offset.left;
        var y = e.pageY - $offset.top;

        $circle.css({
            top: y + 'px',
            left: x + 'px'
        });

        $this.addClass('is-active');

    });

    $ripples.on('animationend webkitAnimationEnd mozAnimationEnd oanimationend MSAnimationEnd', function(e) {
        $(this).removeClass('is-active');
    });

    $('#register').click(function(){

        wallet_info = Athlete.generateNewAddress();
        $('input[name="address"]').val(wallet_info.address);
        $('input[name="privatekey"]').val(wallet_info.privateKey);
        $('#user_register_form').submit();
        //console.log($('#user_register_form').serialize());
    });
});