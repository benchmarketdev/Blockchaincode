var chart = AmCharts.makeChart("chartdiv", {
  "type": "serial", //serial
  "theme": "light",
  "categoryField": 'time', //date
  "valueAxes": [{
    'id': 'a1',
    "position": "right",
    'axisColor': 'white',
    'axisAlpha': 1,
    'color': 'white',
    'unit': '',
    'unitPosition': 'left',
    "minimum": "[[close]]",
    "minMaxMultiplier": 2,
  }, {
    "id": "a2",
    "gridAlpha": 0,
    'axisColor': 'white',
    'color': 'white',
    "axisAlpha": 1,
    "minimum": 0,
    "minMaxMultiplier": 3,
  }],
  "allLabels": [{
    "text": "",
    "rotation": 0,
    "x": "!55",
    "y": "0",
    "width": "50%",
    "size": 10,
    "bold": false,
    "align": "right",
    "color": 'white'
  }],
  "graphs": [{
    "id": "g1",

    "balloonText": "<table style = 'font-size: 12px;' ><tr><td>Open</td><td>[[open]]</td></tr><tr><td>Low</td><td>[[low]]</td></tr><tr><td>High</td><td>[[high]]</td></tr><tr><td>Close</td><td>[[close]]</td></tr><tr><td>Volume</td><td>[[volume]]</td></tr></table>        <!--    Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b><br>Volume:<b>[[volume]]</b -->",
    "closeField": "close",

    "fillColorsField" : 'color_field',
    "fillAlphas": 0.9,
    "highField": "high",
  //  "lineColor": '#31ff31',
    "lineColorField" : 'color_field',
    "lineAlpha": 1,
    "lowField": "low",
  //  "negativeFillColors": "#fe59ba",
  //  "negativeLineColor": "#fe59ba",
    "openField": "open",
    "title": "close:",
    "type": 'candlestick',
    "valueAxis": "a1",
    "valueField": "close",
  },

  {
    "id": "g2",
    'title': 'volume',
    'balloonText': '',
    "colorField": "color_field",
    "lineColor": 'transparent',
    "fillAlphas": 0.9,
    "type": "column",
    "valueAxis": "a2",
    "valueField": "volume",
  }],
  "chartCursor": {
    "valueLineEnabled": true,
    "valueLineBalloonEnabled": true,
    "cursorColor": 'white',
    "color": '#000000',
    "cursorAlpha": 0.5,
    "zoomable": false
  },
  "categoryField": "time",
  "categoryAxis": {
    'axisColor': 'rgba(255,255,255,1)',
    'color': 'white',
    'axisAlpha': 1,
    "minPeriod": "mm",
    "parseDates": true,

  },
  "dataProvider": [],
});

function requestData(sel_type, graphType, axis_label, market_type, dataProvider) {
  var fillcolor;
  //var dataProvider = [];
  //console.log(point);
  //point.forEach(function (element, index) {
  //  year = new Date(point[index]['time']).getFullYear();
  //  month = new Date(point[index]['time']).getMonth() + 1;
  //  day = new Date(point[index]['time']).getDate();
  //  hour = new Date(point[index]['time']).getHours();
  //  minutes = new Date(point[index]['time']).getMinutes();
  //  time = day + " " + hour + ":" + minutes;
  //  if (point[index]['side'] == 'buy') {
  //    fillcolor = '#f6272b'; // red
  //  }
  //  else {
  //    fillcolor = '#31ff31'; // green
  //  }
  //  var itemPoint = {
  //    "date": point[index]['time'], //'' + time ,
  //    "open": point[index]['open'].toString(),
  //    "high": point[index]['high'].toString(),
  //    "low": point[index]['low'].toString(),
  //    "close": point[index]['close'].toString(),
  //    "volume": point[index]['volume'],
  //    'color_field': fillcolor,
  //  }
  //  if (dataProvider.length < 60) {
  //    dataProvider.push(itemPoint);
  //  }
  //
  //}, this);
  //console.log(dataProvider);
  switch (sel_type) {
    case '1m':
      chart.categoryAxis.minPeriod = 'ss';
      break;
    case '5m':
      chart.categoryAxis.minPeriod = 'ss';
      break;
    case '15m':
      chart.categoryAxis.minPeriod = 'ss';
      break;
    case '1h':
      chart.categoryAxis.minPeriod = 'mm';
      break;
    case '6h':
      chart.categoryAxis.minPeriod = 'mm';
      break;
    case '1d':
      chart.categoryAxis.minPeriod = 'mm';
      break;
  }
  if (typeof graphType === 'undefined') {
    graphType = 'candlestick';
  }

  if (graphType == 'line') {
    chart.graphs[0].fillAlphas = 0.2;
    chart.graphs[0].fillColors = ["#3d84d6", "#000000"];
    chart.graphs[0].lineColor = "#3d84d6";
  }
  else {
    chart.graphs[0].fillAlphas = 0.9;
    chart.graphs[0].fillColors = "#46ffd6";
    chart.graphs[0].lineColor = '#46ffd6';
  }
  

  //dataProvider.reverse();

  chart.graphs[0].type = graphType;
  chart.dataProvider = dataProvider;    
  if( dataProvider.length != 0){
    chart.allLabels[0].text = axis_label;
  }
  else{
    chart.allLabels[0].text = '';
  }
  chart.validateData();
  
  $('#curtain').css('display', 'none');
}

function showDepthChart(axis_label, market_type, datas) {

  var data_length, res = [];
  if (datas.bids.length > datas.asks.length) {
    data_length = datas.asks.length;
  }
  else {
    data_length = datas.bids.length;
  }

  var bids_list = new Array(data_length);
  for (var i = 0; i < data_length; i++) {

    var item = {
      bid_size: datas.bids[i].size,
      price: datas.bids[i].price,
      num_orders: datas.bids[i].num_orders
    };
    bids_list[i] = item;
  }

  var asks_list = new Array(data_length);
  for (var i = 0; i < data_length; i++) {

    var item = {
      ask_size: datas.asks[i].size,
      price: datas.asks[i].price,
      num_orders: datas.asks[i].num_orders
    };
    asks_list[i] = (item);
  }

  var data = {
    bids: bids_list.reverse(),
    asks: asks_list
  };


  res.push.apply(data.bids, data.asks); 
  if( data.bids.length != 0){
    chart_2.allLabels[0].text = axis_label;
  }
  else{
    chart_2.allLabels[0].text = '';
  }
  chart_2.dataProvider = data.bids;
  chart_2.allLabels[0].text = axis_label;
  chart_2.validateData();
  $('#curtain_2').css('display', 'none');
}

var chart_2 = AmCharts.makeChart("chartdiv_2", {
  "type": "serial",
  "theme": "light",

  "chartCursor": {
    "cursorColor": '#ffffff',
    "color": '#000000',
    "cursorAlpha": 0.5,
    "zoomable": false
  },
  "allLabels": [{
    "text": "(ETH)",
    "rotation": 0,
    "x": "85",
    "y": "!24",
    "width": "50%",
    "size": 10,
    "bold": false,
    "align": "right",
    "color": 'white'
  }],
  "graphs": [{
    "id": "bids",
    "balloonText": "<table style = 'font-size: 12px;' ><tr><td>bids</td><td>[[bid_size]]</td></tr><tr><td>price</td><td>[[price]]</td></tr></table> ",
    "fillAlphas": 0.1,
    "lineAlpha": 1,
    "lineThickness": 2,
    "lineColor": "#31ff31",
    "type": "step",
    "valueField": "bid_size",
  }, {
    "id": "asks",
    "balloonText": "<table style = 'font-size: 12px;' ><tr><td>asks</td><td>[[ask_size]]</td></tr><tr><td>price</td><td>[[price]]</td></tr></table>",
    "fillAlphas": 0.1,
    "lineAlpha": 1,
    "lineThickness": 2,
    "lineColor": "#f6272b",
    "type": "step",
    "valueField": "ask_size",
  },],
  "categoryField": "price",
  "balloon": {
    "textAlign": "left"
  },
  "valueAxes": [{
    'position': 'left',
    'axisColor': 'white',
    'axisAlpha': 1,
    'color': 'white',
    "minimum": 0,
    "minMaxMultiplier": 2,
  }],
  "categoryAxis": {
    "minHorizontalGap": 100,
    "startOnAxis": true,
    "showFirstLabel": false,
    "showLastLabel": false,
    'axisColor': 'white',
    'axisAlpha': 1,
    'color': 'white'
  },
});

function change_style(sel) {
  if (sel == 'price') {
    chart_selection = 'price';
    $('#chartContain').css('display', 'block');
    $('#chartContain_2').css('display', 'none');

    $("#price_c").css('color', '#fff');
    $("#price_c").css('border-bottom', '1px solid #fff');
    $("#depth_c").css('color', 'hsla(206,8%,82%,.6)');
    $("#depth_c").css('border-bottom', 'hsla(206,8%,82%,.6)');
  }
  else {
    chart_selection = 'depth';

    $('#chartContain').css('display', 'none');
    $('#chartContain_2').css('display', 'block');

    $("#price_c").css('color', 'hsla(206,8%,82%,.6)');
    $("#price_c").css('border-bottom', 'hsla(206,8%,82%,.6)');
    $("#depth_c").css('color', '#fff');
    $("#depth_c").css('border-bottom', '1px solid #fff');
  }
}