
$(document).ready(function(){

    initial_css();
    set_asset();  

    $('.erc_toggle .btn.btn-primary.btn-xs.toggle-on').html('DECENTRALIZED TRADING');    
    $('.erc_toggle .btn.btn-default.btn-xs.active.toggle-off').html('CENTRALIZED TRADING');    
    $('.erc_toggle .toggle.btn.btn-xs.btn-default').css('width', '175px');

    $( ".header .product_selection h4" ).click(function(){
            $(".header .marketinfo .menu_entry").css('color','rgba(81,141,202,.8)');
        }
    );
    $( ".header .product_selection h4" ).click(function() {
            if ($( ".header .product_list" ).css('display') == 'none'){
                $( ".header .product_list" ).css('display', 'block');
            } else {
                $( ".header .product_list" ).css('display', 'none');
            }
        }
    );
    $(".sidebar .orderform .market").click(function(){
        $(".sidebar .orderform .market").css('border','1px solid #fff');
        $(".sidebar .orderform .market").css('color','#fff');
        
        $(".sidebar .orderform .limit").css('border','0px');
        $(".sidebar .orderform .limit").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .stop").css('border','0px');
        $(".sidebar .orderform .stop").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .stoplimit").css('border','0px');
        $(".sidebar .orderform .stoplimit").css('color','hsla(0,0%,100%,.4)');

        $(".sidebar .orderform .market_order").css('display','block');
        $(".sidebar .orderform .limit_order").css('display','none');
        $(".sidebar .orderform .stop_order").css('display','none');
        $(".sidebar .orderform .stoplimit_order").css('display','none');
    });
    $(".sidebar .orderform .limit").click(function(){
        $(".sidebar .orderform .market").css('border','0px');
        $(".sidebar .orderform .market").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .limit").css('border','1px solid #fff');
        $(".sidebar .orderform .limit").css('color','#fff');
        
        $(".sidebar .orderform .stop").css('border','0px');
        $(".sidebar .orderform .stop").css('color','hsla(0,0%,100%,.4)');

        $(".sidebar .orderform .stoplimit").css('border','0px');
        $(".sidebar .orderform .stoplimit").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .market_order").css('display','none');
        $(".sidebar .orderform .limit_order").css('display','block');
        $(".sidebar .orderform .stop_order").css('display','none');
        $(".sidebar .orderform .stoplimit_order").css('display','none');
    });
    $(".sidebar .orderform .stop").click(function(){
        $(".sidebar .orderform .market").css('border','0px');
        $(".sidebar .orderform .market").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .limit").css('border','0px');
        $(".sidebar .orderform .limit").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .stop").css('border','1px solid #fff');
        $(".sidebar .orderform .stop").css('color','#fff');
        
        $(".sidebar .orderform .stoplimit").css('border','0px');
        $(".sidebar .orderform .stoplimit").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .market_order").css('display','none');
        $(".sidebar .orderform .limit_order").css('display','none');
        $(".sidebar .orderform .stop_order").css('display','block');
        $(".sidebar .orderform .stoplimit_order").css('display','none');
    });
    $(".sidebar .orderform .stoplimit").click(function(){
        $(".sidebar .orderform .market").css('border','0px');
        $(".sidebar .orderform .market").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .limit").css('border','0px');
        $(".sidebar .orderform .limit").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .stop").css('border','0px');
        $(".sidebar .orderform .stop").css('color','hsla(0,0%,100%,.4)');
        
        $(".sidebar .orderform .stoplimit").css('border','1px solid #fff');
        $(".sidebar .orderform .stoplimit").css('color','#fff');

        $(".sidebar .orderform .market_order").css('display','none');
        $(".sidebar .orderform .limit_order").css('display','none');
        $(".sidebar .orderform .stop_order").css('display','none');
        $(".sidebar .orderform .stoplimit_order").css('display','block');
    });

    $(".sidebar .orderform .buy").click(function(){
        $(".sidebar .orderform .buy").css('color','#fff');
        $(".sidebar .orderform .buy").css('border','2px solid #31ff31');
        $(".sidebar .orderform .buy").css('font-family','"opensans_bold"');
        
        $(".sidebar .orderform .sell").css('color','hsla(0,0%,100%,.5)');
        $(".sidebar .orderform .sell").css('border','1px solid hsla(0,0%,100%,.5)');
        $(".sidebar .orderform .sell").css('font-family','opensans');
        $(".sidebar .orderform .stateful_btn").css('border','2px solid #31ff31');
        $(".sidebar .orderform .stateful_btn").html("PLACE BUY ORDER");
        if (order_type == "market") {
            $('.market_order .result').html("You will pay.");
        }

        set_asset();
    });
    $(".sidebar .orderform .sell").click(function(){
        $(".sidebar .orderform .buy").css('color','hsla(0,0%,100%,.5)');
        $(".sidebar .orderform .buy").css('border','1px solid hsla(0,0%,100%,.5)');
        $(".sidebar .orderform .buy").css('font-family','opensans');
        
        $(".sidebar .orderform .sell").css('color','#fff');
        $(".sidebar .orderform .sell").css('border','2px solid #fd2d2f');
        $(".sidebar .orderform .sell").css('font-family','"opensans_bold"');
        $(".sidebar .orderform .stateful_btn").css('border','2px solid #fd2d2f');
        $(".sidebar .orderform .stateful_btn").html("PLACE SELL ORDER");
        if (order_type == "market") {
            $('.market_order .result').html("You will receive.");
        }

    });
    
    $(".stateful_btn").click(function(){
        var  quantity, price, stop_price = 'NONE', limit_price = 'NONE', expiration_date = 'NONE', time_in_force = 'NONE';
        get_orderstate();

        if (order_side == "buy"){
            if (parseFloat($('.back_currency_price').html()) == 0){
                $('.msg').html("You can't buy " + front_asset +" because " + back_asset + " balance is 0.");
                $('.div_msg').css('opacity','1');
                $('.div_msg').css('display','block');
                var interval1 = window.setInterval(function () {
                    $( ".div_msg" ).animate({
                            opacity: 0,
                        }, 1000);
                    clearInterval(interval1);
                }, 3000);
                return;
            }
        } else {
            if (parseFloat($('.front_currency_price').html()) == 0){
                $('.msg').html("You can't sell " + front_asset + " because " + front_asset + " balance is 0.");
                $('.div_msg').css('opacity','1');
                $('.div_msg').css('display','block');
                var interval2 = window.setInterval(function () {
                    $( ".div_msg" ).animate({
                        opacity: 0,
                    }, 1000);
                    clearInterval(interval2);
                }, 3000);
                return;
            }
        }

        price = $('.market_stat .num').html();
        if (order_type == "market") {
            
            if ($('.market_order .amount').val() == ''){
                alert("input amount");
                return;
            }
            quantity = $('.market_order .amount').val();
            
        } else if (order_type == "limit") {
            quantity = $('.limit_order .amount').val();
            if ($('.limit_order .amount').val() == ''){
                alert("input amount");
                return;
            }
            if ($('.limit_order .limit_price').val() == ''){
                alert("input limit price");
                return;
            }
            limit_price = $('.limit_order .limit_price').val();
            time_in_force = $('.limit_order #case').val();
            if (time_in_force == "DAY") {
                expiration_date = 1;
            } else if (time_in_force == "GTDT") {
                expiration_date = date_format($('.limit_order #calendar').val(), $('.limit_order #cancel_time').val());
            }
        } else if (order_type == "stop") {
            stop_price = $(".stop_order .stop_price").val();
            if ($('.stop_order .amount').val() == ''){
                alert("input amount");
                return;
            }
            if ($('.stop_order .stop_price').val() == ''){
                alert("input stop price");
                return;
            }
            quantity = $('.stop_order .amount').val();
        } else if (order_type == "stoplimit") {
            stop_price = $(".stoplimit_order .stop_price").val();
            limit_price = $('.stoplimit_order .limit_price').val();
            if ($('.stoplimit_order .amount').val() == ''){
                alert("input amount");
                return;
            }
            if ($('stoplimit_order .stop_price').val() == ''){
                alert("input stop price");
                return;
            }
            quantity = $('.stoplimit_order .amount').val();

            time_in_force = $('.stoplimit_order #case').val();
            if (time_in_force == "DAY") {
                expiration_date = 1;
            } else if (time_in_force == "GTDT") {
                expiration_date = date_format($('.stoplimit_order #calendar').val(), $('.stoplimit_order #cancel_time').val());
            }
        }

        var post_param = {
            customer_id: 1,
            order_side: order_side,
            order_type: order_type,
            quantity: quantity,
            price: parseFloat(price),
            stop_price: stop_price,
            limit_price: limit_price,
            time_in_force: time_in_force,
            expiration_date: expiration_date,
            want_asset: front_asset,
            offer_asset: back_asset
        };
        $.post('addorder', post_param, function(resp) {
            showData();
        });
    });

    $(".sidebar .orderform .advanced_btn").click(function(){
        if ($(".sidebar .orderform .advanced_content").css('display') == 'none'){
            $(".sidebar .orderform .advanced_content").css('display','block');
            $(".sidebar .orderform .advanced_section .header span").css('transform','rotate(0deg)');
        }
        else {
            $(".sidebar .orderform .advanced_content").css('display','none');
            $(".sidebar .orderform .advanced_section .header span").css('transform','rotate(-90deg)');
        }
    });
        
    $(".order_tab").click(function(){
        order_trade_selection = 'order';
        $(".order_tab").css('color','#fff');
        $(".order_tab").css('border-bottom','1px solid #fff');
        $(".trade_tab").css('color','hsla(206,8%,82%,.6)');
        $(".trade_tab").css('border-bottom','hsla(206,8%,82%,.6)');
        
        $(".order_book_panel").css('display','flex');
        $(".trade_history_panel").css('display','none');
    });
    $(".trade_tab").click(function(){
        order_trade_selection = 'trade';
        $(".trade_tab").css('color','#fff');
        $(".trade_tab").css('border-bottom','1px solid #fff');
        $(".order_tab").css('color','hsla(206,8%,82%,.6)');
        $(".order_tab").css('border-bottom','hsla(206,8%,82%,.6)');
        
        $(".order_book_panel").css('display','none');
        $(".trade_history_panel").css('display','flex');
    });
    
    $(".open_tab").click(function(){
        open_fill_selection = 'open';
        $(".open_tab").css('color','#fff');
        $(".open_tab").css('border-bottom','1px solid #fff');
        $(".fill_tab").css('color','hsla(206,8%,82%,.6)');
        $(".fill_tab").css('border-bottom','hsla(206,8%,82%,.6)');
        
        $(".open_orders_panel").css('display','flex');
        $(".fills_panel").css('display','none');
    });
    $(".fill_tab").click(function(){
        open_fill_selection = 'fill';
        $(".fill_tab").css('color','#fff');
        $(".fill_tab").css('border-bottom','1px solid #fff');
        $(".open_tab").css('color','hsla(206,8%,82%,.6)');
        $(".open_tab").css('border-bottom','hsla(206,8%,82%,.6)');
        
        $(".open_orders_panel").css('display','none');
        $(".fills_panel").css('display','flex');
    });
    
    $('.asset_item').click(function(){
        $('.asset_section').css('display','none');
        $('.orderform form').css('display', 'block');
        $( ".c-nav" ).animate({width: 0}, 300);
        
        var str = $(this).find('.crypto_name').html();
        var res = str.split("/");
        front_asset = res[0];
        back_asset = res[1];

        set_asset();
        init_asset_balance();
    });
    
    $('.aggregation_dec').click(function(){
        if (aggregation_num > 0)    {
            aggregation_num--;
            $('.aggregation .value').html(parseFloat(aggregation_values[aggregation_num]).toFixed(2));
        }
    });
    $('.aggregation_inc').click(function(){
        if (aggregation_num < 7)    {
            aggregation_num++;
            $('.aggregation .value').html(parseFloat(aggregation_values[aggregation_num]).toFixed(2));
        }
    });
    
    $('.navicon').click(function(){
        
        if ($('.c-nav').width() > 0){
            $('.asset_section').css('display','none');
            $('.orderform form').css('display','block');
            $( ".c-nav" ).animate({width: 0}, 300);
        } else {
            $( ".c-nav" ).animate({
                width: $('.sidebar').width()
            }, 300, function() {
                $('.orderform form').css('display','none');
                $('.asset_section').css('display','block');
            });
        }
    });
    $('.trade_btn').click(function(){
        hide_all();
        toDefaultColor();
        $('.trade_btn').css('color','white');
        $('.sidebar').css('display','flex');

        footer_selection = 'trade_btn';
    });
    $('.book_btn').click(function(){
        hide_all();
        toDefaultColor();
        $('.book_btn').css('color','white');
        $('.middle_panel').css('display','flex');
        $('.order_book_panel' ).css('display','flex');

        footer_selection = 'book_btn';
    });
    $('.charts_btn').click(function(){
        hide_all();
        toDefaultColor();
        $('.charts_btn').css('color','white');
        $('.middle_panel').css('display','flex');
        $('.price_chart_panel').css('display','flex');

        footer_selection = 'charts_btn';
    });
    $('.orders_btn').click(function(){
        hide_all();
        toDefaultColor();
        $('.orders_btn').css('color','white');
        $('.bottom_panel').css('display','flex');
        $('.open_orders_panel').css('display','flex');

        footer_selection = 'orders_btn';
    });
    
    $('.limit_order #case').on('change', function() {
        if (this.value  == "GTDT"){
            $(".limit_order .section.cancel").css("display","block");
        } else {
            $(".limit_order .section.cancel").css("display","none");
        }
    })
    $('.stoplimit_order #case').on('change', function() {
        if (this.value  == "GTDT"){
            $(".stoplimit_order .section.cancel").css("display","block");
        } else {
            $(".stoplimit_order .section.cancel").css("display","none");
        }
    })

    $( ".market_order .amount" ).keyup(function() {
        calc_total();
    });
    $( ".limit_order .amount" ).keyup(function() {
        calc_total();
    });
    $( ".limit_order .limit_price" ).keyup(function() {
        calc_total();
    });

    $("#deposit_btn").click(function(){
        /**
         * Changed By Webhero9297
         */
        var want_asset = (parseFloat($(".front_currency_price").html()) == 0 ) ? '' : $(".front_currency_price").html();
        var offer_asset = (parseFloat($(".back_currency_price").html()) == 0 ) ? '' : $(".back_currency_price").html();
        $("#front_asset_value").addClass('text-right');
        $("#back_asset_value").addClass('text-right');
        /*** End */
        $(".deposit_bg").css('display','block');

        flag = "deposit";
    })
    $("#withdraw_btn").click(function(){
        var want_asset = (parseFloat($(".front_currency_price").html()) == 0 ) ? '' : $(".front_currency_price").html();
        var offer_asset = (parseFloat($(".back_currency_price").html()) == 0 ) ? '' : $(".back_currency_price").html();
        $("#front_asset_value").addClass('text-right');
        $("#back_asset_value").addClass('text-right');
        $(".deposit_bg").css('display','block');

        flag = "withdraw";
    });  
    $("#btn_deposit_cancel").click(function(){
        $(".deposit_bg").css('display','none');
    });
    $("#btn_deposit_ok").click(function(){
        /**
         * Changed By Webhero9297
         */
        var want_asset_balance = $("#front_asset_value").val();
        var offer_asset_balance = $("#back_asset_value").val();
        var product = front_asset + "-" + back_asset;
        var post_param = { want_asset_balance:want_asset_balance, offer_asset_balance:offer_asset_balance };
        if (flag == "deposit") {
            $.post('assetdeposit/'+ product, post_param, function(resp) {
                init_asset_balance();
            });
        } else {
            $.post('assetwithdraw/'+ product, post_param, function(resp) {
                init_asset_balance();
            });
        }
        /*** End */
        $(".deposit_bg").css('display','none');

    });

    $('#user').click(function(){
        if ($('#logout').css('display') == 'none')
            $('#logout').css('display', 'block');
        else
            $('#logout').css('display', 'none');
    });

    init_asset_balance();
    init_time();

});

$(window).resize(function(){
    initial_css();
    
    if ($('body').width() > 1473){
        $(".order_book_panel").css('display','flex');
        $(".trade_history_panel").css('display','flex');
        $(".open_orders_panel").css('display','flex');
        $(".fills_panel").css('display','flex');
    } else {
        if ($('body').width() >= 750){
            show_all();
            if (order_trade_selection == 'order'){
                $(".order_book_panel").css('display','flex');
                $(".trade_history_panel").css('display','none');
            } else {
                $(".order_book_panel").css('display','none');
                $(".trade_history_panel").css('display','flex');
            }
            if (open_fill_selection == 'open'){
                $(".open_orders_panel").css('display','flex');
                $(".fills_panel").css('display','none');
            } else {
                $(".open_orders_panel").css('display','none');
                $(".fills_panel").css('display','flex');
            }
        }
    }
});

function init_time() {
    var items = new Array();
    for (var i=0;i<48;i++){
        if (i % 2 == 0){
            items[i] = i / 2 + ':00';
        } else {
            items[i] = Math.floor(i / 2) + ':30';
        }
    }
    $.each(items, function (i, item) {
        $('.limit_order #cancel_time').append($('<option>', { 
            value: item,
            text : item 
        }));
        $('.stoplimit_order #cancel_time').append($('<option>', { 
            value: item,
            text : item 
        }));
    });
}

function date_format(date_str, time_str) {
    var time_tmp = time_str.split(':');
    if (parseInt(time_tmp[0]) < 10 )    time_str = '0' + time_str;
    var result = date_str + ' ' + time_str + ':00';
    return result;
}

function init_asset_balance() {
    $.get('getassetbalance/'+ front_asset + '-' + back_asset, function(resp) {
        resp = typeof resp == 'string' ? JSON.parse(resp) : resp;
        $('.front_currency_price').html(resp.want_asset_balance||0);
        $('.back_currency_price').html(resp.offer_asset_balance||0);
    });
}

function doOnERC20Toggle() {
    location.href=erc20_url;
}

function toDefaultColor(){
    $('.trade_btn').css('color','hsla(0,0%,100%,.5)');
    $('.book_btn').css('color','hsla(0,0%,100%,.5)');
    $('.charts_btn').css('color','hsla(0,0%,100%,.5)');
    $('.orders_btn').css('color','hsla(0,0%,100%,.5)');
}

function initial_css(){
    if ($('body').width() < 750){
        cnav_height = $('body').height() - 86;
        sidebar_height = $('body').height() - 46;
        middle_panel_width = $('body').width();
        order_book_panel_height = $('body').height() - 46;
        order_book_content_height = order_book_panel_height - 77;
        price_chart_content_height = 768;
        price_chart_panel_height = order_book_panel_height;
        trade_history_content_height = order_book_panel_height - 72;
        price_chart_panel_width = $('body').width();
        fills_content_height = $('body').height() - $('.open_orders_header').height() - $('.open_orders_panel .table_head').height() - 46 - $('.banner').height();
        bottom_panel_height = $('body').height() - 46;

        $('#chartContain').css('display','block');
        $('#chartContain_2').css('display','block');
        $('.' + footer_selection).click();
    } else{
        if ($('body').width() > 1473){
            order_book_panel_height = 347;
            price_chart_panel_height = 694 + 23;
            price_chart_content_height = 668;
            price_chart_panel_width = $('body').width() - 230 - 620 - 4 - 100;

            $('#chartContain').css('display','block');
            $('#chartContain_2').css('display','block');
        } else {
            order_book_panel_height = 347;
            price_chart_panel_height = 347;
            price_chart_content_height = 280;
            price_chart_panel_width = $('body').width() - 70;

            if (chart_selection == 'price') {
                $('#chartContain').css('display','block');
                $('#chartContain_2').css('display','none');
                $("#price_c").css('color','#fff');
            } else {
                $('#chartContain').css('display','none');
                $('#chartContain_2').css('display','block');
                $("#depth_c").css('color','#fff');
            }
        }
        bottom_panel_height = $('body').height() - 696;
        cnav_height = $('body').height() - 40;
        sidebar_height = $('body').height();
        middle_panel_width = $('body').width() - 232;
        trade_history_content_height = order_book_panel_height - 72;
        fills_content_height = bottom_panel_height - 72 - $('.banner').height();
        order_book_content_height = order_book_panel_height - 58;
    }
    etherdelta_height = $('body').height() - 30;
    $(".sidebar").css("height", sidebar_height + 'px');
    $(".middle_panel").css("width", middle_panel_width + 'px');
    $(".bottom_panel").css("width", middle_panel_width + 'px');
    $(".price_chart_content").css('height',price_chart_content_height + 'px');
    $(".fills_panel .table_content").css("height", trade_history_content_height + 'px');
    $(".open_orders_panel .table_content").css("height", trade_history_content_height + 'px');
    $(".order_book_panel .table_content").css('height', order_book_content_height + 'px');
    $(".trade_history_panel .table_content").css('height', trade_history_content_height + 'px');

    $('.etherdelta iframe').attr('width', '100%');
    $('.etherdelta iframe').attr('height', etherdelta_height + 'px');

    if ($('.c-nav').width() > 0)
        $('.c-nav').css('width', $('.sidebar').width() + 'px');

    
}

function hide_all(){
    $('.sidebar').css('display','none');
    $('.bottom_panel').css('display','none');
    $('.middle_panel').css('display','none');
    $('.price_chart_panel').css('display','none');
    $('.trade_history_panel' ).css('display','none');
    $('.order_book_panel' ).css('display','none');
    $('.open_orders_panel' ).css('display','none');
    $('.fills_panel' ).css('display','none');
}

function show_all(){
    $('.sidebar').css('display','flex');
    $('.bottom_panel').css('display','flex');
    $('.middle_panel').css('display','flex');
    $('.price_chart_panel').css('display','flex');
    $('.trade_history_panel' ).css('display','flex');
    $('.order_book_panel' ).css('display','flex');
    $('.open_orders_panel' ).css('display','flex');
    $('.fills_panel' ).css('display','flex');
}

function set_asset(){
    $('.front_asset').html(front_asset);
    $('.back_asset').html(back_asset);

    showPriceChart();
}

function set_reverse_asset(){
    $('.market_order .back_asset').html(front_asset);
    $('.market_order .order_total .front_asset').html(back_asset);

    $('.stop_order .amount_section .back_asset').html(front_asset);
    $('.stop_order .order_total .front_asset').html(back_asset);
}

function calc_total(){
    get_orderstate();
    if (order_type == "market"){
        var amount = parseFloat($('.market_order .amount').val() || 0);
        var tradeprice = parseFloat($('.market_stat .num').html());
        var total;
        total = parseFloat(amount * tradeprice).toFixed(8);
        $('.market_order .total').html(total);
    } else if (order_type == "limit") {
        var amount = parseFloat($('.limit_order .amount').val() || 0);
        var limitprice = parseFloat($('.limit_order .limit_price').val() || 0);
        var total = parseFloat(amount * limitprice).toFixed(2);
        $('.limit_order .total').html(total);
    }
}

function get_orderstate() {
    if ($('.market').css('color') == 'rgb(255, 255, 255)' || $('.market').css('color') == '#fff') {
        order_type = "market";
    } else if ($('.limit').css('color') == 'rgb(255, 255, 255)' || $('.limit').css('color') == '#fff') {
        order_type = "limit";
    } else if ($('.stop').css('color') == 'rgb(255, 255, 255)' || $('.stop').css('color') == '#fff') {
        order_type = "stop";
    } else if ($('.stoplimit').css('color') == 'rgb(255, 255, 255)' || $('.stop').css('color') == '#fff') {
        order_type = "stoplimit";
    }
    
    if ($('.buy').css('color') == 'rgb(255, 255, 255)' || $('.buy').css('color') == '#fff') {
        order_side = "buy";
    } else if ($('.sell').css('color') == 'rgb(255, 255, 255)' || $('.sell').css('color') == '#fff') {
        order_side = "sell";
    }
}