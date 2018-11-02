$(document).ready(function(){
    if ( chatting != undefined ) {
        Echo.join('ppl-chatroom')
            .here(function(e){
                console.log('here', e);
                getMessages();
            })
            .joining(function(e){
                console.log('joining', e)
            })
            .leaving(function(e){
                console.log('leaving', e);
            })
            .listen('MessagePosted', function(e){
                getMessages();
                console.log('listen', e);
            });

        $('input[name="message"]').on('keyup', function(event){
            if (event.keyCode == 13) {
                doOnSendMessage();
            }
        })

    }
});

function getMessages() {
    $.get('/messages', function(message_array){
        msgTag = '';
        for( i in message_array ){
            message = message_array[i];
            if ( message.user_id == user_id )
                fontStyle= " white-text";
            else
                fontStyle=  " italic-font";
            msgTag += '<div class="message-container">\
                          <span class="span-username" onclick="doOnClickUser(this)">'+message.user_name+':</span>\
                          <span class="span-message-content'+fontStyle+'">'+message.message+'</span>\
                      </div>';

        //<span class="time-right">'+message.created_at+'</span>\
        }
        $('.message-wraper').html(msgTag);
        $('.message-wraper').animate({ scrollTop: $('.message-wraper').prop("scrollHeight")}, 100);
        //$('.chat-container').css('height', 'calc(100% - 42px)');
        //$('.message-wraper').css('height', parseFloat($('.chat-container').height())-82);
        //console.log('messages', message_array);
    })
}
function doOnClickUser(tagHTML) {
    $('input[name="message"]').val(tagHTML.innerText);
}
function doOnSendMessage() {
    $.get('/sendmessage', {message: $('input[name="message"]').val()}, function(){
        getMessages();
        $('input[name="message"]').val('');
    });
}



