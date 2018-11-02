// Directive for creating the timezone selector for a user
angular.module('BitGo.Common.BGTimezoneSelect', [])

.directive('bgTimezoneSelect', ['$compile', '$rootScope',
  function($compile, $rootScope) {
    return {
      restrict: 'E',
      template: '<select></select>',
      scope: {
        settings: '=settings'
      },
      link: function(scope, ele, attrs) {
        var Timezone = {
          init : function(cities, formatName){
            this.cities = [];
            this.formatName = formatName;

            for(var key in cities) {
              if (typeof cities[key] != 'function') {
                this.cities.push({
                  name: cities[key],
                  offset: moment.tz(cities[key]).format('Z')
                });
              }
            }
            // sort by time offset
            this.cities.sort(function(a, b){
              return parseInt(a.offset.replace(":", ""), 10) - parseInt(b.offset.replace(":", ""), 10);
            });
            // generate the html
            this.html = this.getHTMLOptions();
            this.currentTimezone = this.getCurrentTimezoneKey();
          },
          getHTMLOptions : function(){
            var html = '';
            var offset = 0;
            var index;
            var city;
            for(index = 0; index < this.cities.length; index++) {
              city = this.cities[index];
              if (scope.settings) {
                if (city.name === scope.settings.timezone) {
                  scope.settings.timezoneDisplay = '(GMT ' + city.offset + ') ' + city.name;
                }
              }
              html += '<option offset="' + city.offset + '" value='+ city.name +'>(GMT ' + city.offset + ') ' + city.name +'</option>';
            }
            return html;
          },
          getCurrentTimezoneKey : function(){
            return moment().format('Z');
          }
        };
        Timezone.init(moment.tz.names());
        var options = Timezone.getHTMLOptions();
        var compiledEle = $compile('<select ng-model="settings.timezone" class="customSelect-select">' + options + '</select>')(scope);
        scope.$watchCollection('[settings.timezoneDisplay, settings.timezone]', function() {
          if (scope.settings) {
            scope.settings.timezoneDisplay = '(GMT ' + moment.tz(scope.settings.timezone).format('Z') +') ' + scope.settings.timezone;
          }
        });
        ele.replaceWith(compiledEle);
      }
    };
  }
]);
