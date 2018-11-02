var list_num = 50;
var interval_num_order_book = 0, interval_num_trade = 0, interval_num_open_orders = 0, interval_num_fills = 0;
var interval_num_pricechart = 0, interval_num_depthchart = 0;

addEventListener('DOMContentLoaded', function () {
    pickmeup('.limit_order #calendar', {
        position       : 'right',
        hide_on_select : true,
        format: 'Y-m-d'
    });
    pickmeup('.stoplimit_order #calendar', {
        position       : 'right',
        hide_on_select : true,
        format: 'Y-m-d'
    });
});

$(document).ready(function () {
    var intervalId = window.setInterval(function () {
        interval_num_order_book++;
        interval_num_trade++;
        interval_num_open_orders++;
        interval_num_fills++;
        showData();
        showPriceChart();
    }, 3000);

    $('#sel_hour').change(function(){	
        showPriceChart();
    });

    $('#sel_chart').change(function(){	
        showPriceChart();
    });
});

function showData() {
    $.get('gettradedata/' + front_asset + '-' + back_asset, function (resp) {
        var data = typeof resp == 'string' ? JSON.parse(resp) : resp;
//console.log(data);return;
        putOrderData(data.orderbook);
        putTradeData(data.tradehistory);
        putOpenOrders(data.openorder);
        putFills(data.fills);
        putBannerInfo(data.orderbook);

        var market_type = front_asset + '-' + back_asset;
        showDepthChart(back_asset, market_type, data.depthchart);  //depth chart
    });
}

function showPriceChart() {
    var sel_hour = $('#sel_hour').val();
    $.get('getpricechartdata/' + front_asset + '-' + back_asset + '?time_scale=' + sel_hour , function (resp) {
        var data = typeof resp == 'string' ? JSON.parse(resp) : resp;
        var sel_graphType = $('#sel_chart').val();
        var sel_hour = $('#sel_hour').val();
        var market_type = front_asset + '-' + back_asset;

        requestData(sel_hour, sel_graphType, back_asset, market_type, data);  //price chart
    });
}

function putBannerInfo(data) {
    data.spread = parseFloat(data.spread).toFixed(8);
    $('.spread_info_bar .bid .num').html(data.best_bid_price + '&nbsp;');
    $('.spread_info_bar .ask .num').html(data.best_ask_price + '&nbsp;');
    $('.spread_info_bar .spread .num').html(data.spread + '&nbsp;');
}

function putOrderData(data) {
    if (interval_num_order_book == 1)  {
        showLoading('order_book');
    }
    var asks = data.ask;
    var bids = data.bid;
    var asks_bids_tbl_str = '<table style="width:100%;float:left;"><tbody>';

    asks_bids_body_html = '';
    var num = asks.length > bids.length ? asks.length : bids.length;
    for (var i = 0; i < num; i++){
        
        if (i >= asks.length){
            var ask = {my_size:'&nbsp;', quantity:'&nbsp;', limit_price:'&nbsp;', size_main:'&nbsp;', size_zero:'&nbsp;'};
        } else {
            var ask = asks[i];
            ask.quantity = parseFloat(ask.quantity).toFixed(8);
            ask.limit_price = parseFloat(ask.limit_price).toFixed(5);
            ask.size_main = ask.quantity.toString().substr(0, ask.quantity.toString().length - zero_count(ask.quantity));
            ask.size_zero = ask.quantity.toString().substr(ask.quantity.toString().length - zero_count(ask.quantity), zero_count(ask.quantity));
        }
        if (i >= bids.length){
            var bid = {my_size:'&nbsp;', quantity:'&nbsp;', limit_price:'&nbsp;', size_main:'&nbsp;', size_zero:'&nbsp;'};
        } else {
            var bid = bids[i];
            bid.quantity = parseFloat(bid.quantity).toFixed(8);
            bid.limit_price = parseFloat(bid.limit_price).toFixed(5);
            
            bid.size_main = bid.quantity.toString().substr(0, bid.quantity.toString().length - zero_count(bid.quantity));
            bid.size_zero = bid.quantity.toString().substr(bid.quantity.toString().length - zero_count(bid.quantity), zero_count(bid.quantity));
        }
        asks_bids_body_html += '<tr class="asks_tr" style="font-size:11px;line-height:16px;" ><td>\n\
<div style="text-align:center;width:15%;float:left;"><span style="color:white;">-</span></div>\n\
<div style="text-align:right;width:15%;float:left;"><span style="color:white;">' + ask.size_main + '</span><span style="color:#5c5c5c">' + ask.size_zero + '</span></div>\n\
<div style="text-align:right;width:18%;float:left;"><span style="color:#fd2d2f;">' + ask.limit_price + '</span></div>\n\
<div style="width:4%;float:left;">&nbsp;</div>\n\
<div style="text-align:left;width:18%;float:left;"><span style="color:#31ff31;">' + bid.limit_price + '</span></div>\n\
<div style="text-align:right;width:15%;float:left;padding-right:4%"><span style="color:white;">' + bid.size_main + '</span><span style="color:#5c5c5c">' + bid.size_zero + '</span></div>\n\
<div style="text-align:center;width:15%;float:left;"><span style="color:white;">-</span></div></td></tr>';
    }
    
    asks_bids_tbl_str += asks_bids_body_html + "</tbody></table>";

    $('#div_asks_bids').html(asks_bids_tbl_str);
    if (interval_num_order_book > 0){
        stopLoading('order_book');
    }
}

function putTradeData(trades) {
    if (interval_num_trade == 1)  {
        showLoading('trade');
    }
    var trade_tbl_str = '<table style="width:100%;float:left;"><tbody>';
    trade_body_html = '';
    for (i = 0; i < trades.length-1; i++) {
        
        var trade = trades[i];
        //var tmp = trade.time.split('.')[0].split('T')[0].split('-');
        //var time_str = tmp[1] + '-' + tmp[2] + ' ' + trade.time.split('.')[0].split('T')[1];
        var time_str = 'ssds';
        if (i == trades.length - 1) {
            nextTrade = trades[i];
        } else {
            nextTrade = trades[i + 1];
        }
        if (trades[i].price > trades[i+1].price)    
            var arrow = '<i class="fa fa-angle-up" aria-hidden="true"></i>';
        else {
            var arrow = '<i class="fa fa-angle-down" aria-hidden="true"></i>';
        }
        trade.quantity = parseFloat(trade.quantity).toFixed(8);
        trade.size_main = trade.quantity.toString().substr(0, trade.quantity.toString().length - zero_count(trade.quantity));
        trade.size_zero = trade.quantity.toString().substr(trade.quantity.toString().length - zero_count(trade.quantity), zero_count(trade.quantity));

        if (trade.side == "sell"){
            trade_body_html += '<tr class="trades_tr" style="font-size:11px;line-height:16px;" data-price=""><td>\n\
<div style="text-align:right;width:30%;float:left;top:0px;left:0px;"><span style="color:white;">' + trade.size_main + '</span><span style="color:#5c5c5c">' + trade.size_zero + '</span></div>\n\
<div style="text-align:center;width:40%;float:left;color:#fd2d2f;"><span>' + parseFloat(trade.price).toFixed(5) + '&nbsp;</span>' + arrow + '</div>\n\
<div style="text-align:left;width:30%;float:left;"><span style="color:white;">' + trade.time + '</span></div></td></tr>';
        } else {
            trade_body_html += '<tr class="trades_tr" style="font-size:11px;line-height:16px;" data-price=""><td>\n\
<div style="text-align:right;width:30%;float:left;top:0px;left:0px;"><span style="color:#d7d7d8;">' + trade.size_main + '</span><span style="color:#5c5c5c">' + trade.size_zero + '</span></div>\n\
<div style="text-align:center;width:40%;float:left;color:#31ff31;"><span>' + parseFloat(trade.price).toFixed(5) + '&nbsp;</span>' + arrow + '</div>\n\
<div style="text-align:left;width:30%;float:left;"><span style="color:#d7d7d8;">' + trade.time + '</span></div></td></tr>';
        }
    }

    trade_tbl_str += trade_body_html + "</tbody></table>";
    
    $('#div_trades').html(trade_tbl_str);
    if (interval_num_trade > 0){
        stopLoading('trade');
    }
}

function putOpenOrders(orders) {
    if (interval_num_open_orders == 1)  {
        showLoading('open_orders');
    }
    var tbl_str = '<table style="width:100%;float:left;"><tbody>';
    body_html = '';
    for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        var filled_str = '';
        if (order.side == "buy") 
            var color = "#31ff31";
        else
            var color = "#fd2d2f";
        var num = parseFloat(order.filled_quantity) / parseFloat(order.quantity);
        if (num > 1)    num = 1;
        
        order.quantity = parseFloat(order.quantity).toFixed(8);
        order.size_main = order.quantity.toString().substr(0, order.quantity.toString().length - zero_count(order.quantity));
        order.size_zero = order.quantity.toString().substr(order.quantity.toString().length - zero_count(order.quantity), zero_count(order.quantity));
        order.filled_quantity = parseFloat(parseFloat(order.quantity) - parseFloat(order.remaining_quantity)).toFixed(8);
        order.filled_main = order.filled_quantity.toString().substr(0, order.filled_quantity.toString().length - zero_count(order.filled_quantity));
        order.filled_zero = order.filled_quantity.toString().substr(order.filled_quantity.toString().length - zero_count(order.filled_quantity), zero_count(order.filled_quantity));

        filled_str = '<div style="float:left;width:40px;height:10px;border:1px solid ' + color + ';margin-top: 5px;"><div style="float:left;height:8px;width:' + num*38 + 'px;background-color:' + color + ';"></div></div>';

        body_html += '<tr class="open_orders_tr" style="font-size:11px;line-height:20px;" data-price=""><td>\n\
<div style="text-align:center;width:10%;float:left;"><div style="color:white;border:1px solid #d7d7d8;border-radius:8px;height:16px;width: 16px;margin: auto;font-size:10px;"><div style="margin-top: -2px;">' + order.type.substr(0,1).toUpperCase() + '</div></div></div>\n\
<div style="text-align:right;width:15%;float:left;padding-right: 4%;"><span style="color:white;">' + order.size_main + '</span><span style="color:#5c5c5c">' + order.size_zero + '</span></div>\n\
<div style="text-align:center;width:15%;float:left;color:white;">' + filled_str + '<div><span style="color:white;">' + order.filled_main + '</span><span style="color:#5c5c5c">' + order.filled_zero + '</span></div></div>\n\
<div style="text-align:center;width:15%;float:left;"><span style="color:' + color + ';">' + parseFloat(order.limit_price).toFixed(5) + '</span></div>\n\
<div style="text-align:center;width:15%;float:left;"><span style="color:white;">0</span></div>\n\
<div style="text-align:center;width:15%;float:left;"><span style="color:white;">' + order.updated_at + '</span></div>\n\
<div style="text-align:center;width:15%;float:left;"><span style="color:white;">Open</span></div>\n\
</td></tr>';
    }
    tbl_str += body_html + "</tbody></table>";
    
    $('#div_open_orders').html(tbl_str);
    if (interval_num_open_orders > 0){
        stopLoading('open_orders');
    }
}

function putFills(fills) {
    if (interval_num_fills == 1)  {
        showLoading('fills');
    }
    var tbl_str = '<table style="width:100%;float:left;"><tbody>';
    body_html = '';
    for (i = 0; i < fills.length; i++) {
        var fill = fills[i];
        if (fill.side == "buy") 
            var color = "#fd2d2f";
        else
            var color =  "#31ff31";
        fill.quantity = parseFloat(fill.quantity).toFixed(8);
        fill.size_main = fill.quantity.toString().substr(0, fill.quantity.toString().length - zero_count(fill.quantity));
        fill.size_zero = fill.quantity.toString().substr(fill.quantity.toString().length - zero_count(fill.quantity), zero_count(fill.quantity));

        body_html += '<tr class="open_orders_tr" style="font-size:11px;line-height:18px;"><td>\n\
<div style="text-align:right;width:20%;float:left;padding-right: 2%;"><span style="color:white;">' + fill.size_main + '</span><span style="color:#5c5c5c">' + fill.size_zero + '</span></div>\n\
<div style="text-align:center;width:20%;float:left;"><span style="color:' + color + ';">' + parseFloat(fill.price).toFixed(5) + '</span></div>\n\
<div style="text-align:center;width:20%;float:left;"><span style="color:white;">'+parseFloat(fill.commission).toFixed(5)+'</span></div>\n\
<div style="text-align:center;width:20%;float:left;"><span style="color:white;">' + fill.time + '</span></div>\n\
<div style="text-align:center;width:20%;float:left;"><span style="color:white;">' + fill.product + '</span></div>\n\
</td></tr>';
    }
    tbl_str += body_html + "</tbody></table>";
    
    $('#div_fills').html(tbl_str);
    if (interval_num_fills > 0){
        stopLoading('fills');
    }
}

function showLoading(str) {
    if (str == 'order_book')
        $('#order_book_loading').css('display', 'block');
    else if (str == 'trade')
        $('#trade_loading').css('display', 'block');
    else if (str == 'open_orders')
        $('#open_orders_loading').css('display', 'block');
    else if (str == 'fills')
        $('#fills_loading').css('display', 'block');
}

function stopLoading(str) {
    if (str == 'order_book')
        $('#order_book_loading').css('display', 'none');
    else if (str == 'trade')
        $('#trade_loading').css('display', 'none');
    else if (str == 'open_orders')
        $('#open_orders_loading').css('display', 'none');
    else if (str == 'fills')
        $('#fills_loading').css('display', 'none');
}

function zero_count(value){
    var str = value.toString();
    var tmp = str.split('.')[1];
    for (var i=7;i>=1;i--){
        if (tmp[i] != '0') {
            break;
        }
    }
    return 8 - i - 1;
}