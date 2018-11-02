// Directive for the market widget on the side of dashboard

angular.module('BitGo.Enterprise.MarketWidgetDirective', [])

.directive('marketWidget', ['$rootScope', '$http', 'MarketDataAPI',
  function($rootScope, $http, MarketDataAPI) {
    return {
      restrict: 'E',
      templateUrl: '/enterprise/templates/marketWidget.html',
      scope: {},
      controller: ['$scope', function($scope) {
        $scope.userHover = false;
        var today = new Date();
        $scope.currentDate = today.toUTCString().slice(5,16);
        $scope.showData = function () {
          $scope.userHover = true;
        };

        $scope.hideData = function () {
          $scope.userHover = false;
        };

        // sets and updates $scope.currency data on the isolate scope
        function setScope(currencyData, marketDataAvailable){
          // check if currency data is received first
          if (currencyData && currencyData.data && currencyData.data.current) {
            // restrict the price to 2 decimal values
            $scope.delta = (Math.round((currencyData.data.current.last - currencyData.data.current['24h_avg'])*100)/100).toFixed(2);
            $scope.changePercent = (Math.round($scope.delta / currencyData.data.current['24h_avg'] * 10000)/100).toFixed(2);
            if (Number($scope.delta) > 0) {
              $scope.direction = "up";
            } else if (Number($scope.delta) === 0) {
              $scope.direction = "nochange";
            } else {
              $scope.direction = "down";
            }
            currencyData.data.current.last = parseFloat(currencyData.data.current.last).toFixed(2);
            currencyData.data.current.prevDayHigh = parseFloat(currencyData.data.current.prevDayHigh).toFixed(2);
            currencyData.data.current.prevDayLow = parseFloat(currencyData.data.current.prevDayLow).toFixed(2);
            $scope.currency = currencyData;
            $scope.marketDataAvailable = marketDataAvailable;
          }
        }
        setScope($rootScope.currency, $rootScope.marketDataAvailable);

        //initialize chartTime to one day
        $scope.chartTime = 'months';
        var killCurrencyUpdated = $rootScope.$on('MarketDataAPI.AppCurrencyUpdated', function(event, currencyData) {
          setScope(currencyData, $rootScope.marketDataAvailable);
        });

        // Clean up the listeners -- helps decrease run loop time and
        // reduce liklihood of references being kept on the scope
        $scope.$on('$destroy', function() {
          killCurrencyUpdated();
        });

        $scope.setTime = function(time) {
          if ($scope.chartTime !== time){
            $scope.chartTime = time;
            $scope.updateChart(time);
          }
        };
        $scope.isCurrentTime = function(time) {
          return $scope.chartTime === time;
        };

      }],
      link: function(scope, element, attr){
        var chart;
        var timeRanges = ['week', 'month', 'months'];

        function setYAxis(max, min){
          max = Math.ceil(max);
          min = Math.floor(min);
          max = max + 4 - ((max-min) % 4);
          chart.yAxis.tickValues([min, min + (max-min)/4, min + (max-min)/2, min + (3*(max-min)/4), max]);
        }

        function setChartData(range, currency){
          MarketDataAPI.price(range, currency).then(function(values){
            var data = [{values: values.prices, key: 'Bitcoin value', color: "#09a1d9"}];
            setYAxis(values.max, values.min);
            d3.select('#chart')    //Select the <svg> element you want to render the chart in.
            .datum(data)         //Populate the <svg> element with chart data...
            .call(chart);          //Finally, render the chart!
          });
        }

        var isValidTime = function (time) {
          return _.indexOf(timeRanges, time) > -1;
        };

        scope.updateChart = function(time){
          if (isValidTime(time) && scope.currency) {
            var data;
            switch (time) {
              case 'week':
                setChartData(7, scope.currency.currency);
                break;
              case 'month':
                setChartData(30, scope.currency.currency);
                break;
              case 'months':
                setChartData(90, scope.currency.currency);
                break;
              default:
                setChartData(90, scope.currency.currency);
                break;
            }
          }
        };

        nv.addGraph(function() {
          chart = nv.models.lineChart()
                  .margin({left: 25, right: 0, top: 12})  //Adjust chart margins to give the x-axis some breathing room.
                  .useInteractiveGuideline(true)         //We want nice looking tooltips and a guideline!
                  .transitionDuration(500)  //How fast do you want the lines to transition?
                  .showLegend(false)        //Show the legend, allowing users to turn on/off line series.
                  .showYAxis(true)          //Show the y-axis
                  .showXAxis(false);        //Show the x-axis

          chart.xAxis     //Chart x-axis settings
          .tickFormat(d3.format(',r'))
          .orient("bottom");

          chart.yAxis     //Chart y-axis settings
          .tickFormat(d3.format('.00f'))
          .tickValues([450, 410, 350])
          .orient('left');

          if (scope.currency) {
            setChartData(90, scope.currency.currency);
          }

          //Update the chart when window resizes.
          nv.utils.windowResize(function() {
            if (!chart) {
              return;
            }
            if (chart.update && typeof(chart.update) === "function") {
              chart.update();
            }
          });
          return chart;
        });
      }
    };
  }
]);
