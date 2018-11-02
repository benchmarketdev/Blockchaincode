// Manages server error and success notifications in the app
angular.module('BitGo.Notifications.NotifyService', [])

.factory('NotifyService', ['$timeout','$http','$compile','$templateCache','$rootScope',
  function($timeout, $http, $compile, $templateCache, $rootScope){

    var templates = {
      info: '/notifications/templates/info.html',
      error: '/notifications/templates/error.html',
      success: '/notifications/templates/success.html'
    };
    var startTop = 75;
    var verticalSpacing = 15;
    var duration = 5000;
    var defaultType = 'info';
    var position = 'center';
    var container = document.body;

    // local instance of the message elements
    var messageElements = [];

    // Notifier Constructor
    var Notifier = function() {};

    Notifier.prototype.notify = function(args) {
      if (typeof args !== 'object'){
        args = {message:args};
      }

      // set up the locals
      args.type = args.type || defaultType;
      args.position = args.position || position;
      args.container = args.container || container;
      args.classes = args.classes || '';

      // set up the scope for the template
      var scope = args.scope ? args.scope.$new() : $rootScope.$new();
      scope.$message = args.message;
      scope.$classes = args.classes;
      try {
        $http.get(templates[args.type], {cache: $templateCache}).success(function(template){

          // compile the template with the new scope
          var templateElement = $compile(template)(scope);
          // bind to the end of the opacity transition event, and when the
          // element is invisible, remove it from the messages array and view
          templateElement.bind('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd', function(e){
            if (e.propertyName === 'opacity' ||
              (e.originalEvent && e.originalEvent.propertyName === 'opacity')){
              templateElement.remove();
              messageElements.splice(messageElements.indexOf(templateElement),1);
              layoutMessages();
            }
          });

          angular.element(args.container).append(templateElement);
          messageElements.push(templateElement);

          if (args.position === 'center'){
            $timeout(function(){
              templateElement.css('margin-left','-' + (templateElement[0].offsetWidth /2) + 'px');
            });
          }

          scope.$close = function(){
            // at end of transition, message is removed
            templateElement.css('opacity', 0).attr('data-closing', 'true');
            // reflow the messages and clean up the old scope
            layoutMessages();
            scope.$destroy();
          };

          var layoutMessages = function(){
            var currentY = startTop;
            for(var i = messageElements.length - 1; i >= 0; i --){
              var shadowHeight = 10;
              var element = messageElements[i];
              var height = element[0].offsetHeight;
              var top = currentY + height + shadowHeight;
              if (element.attr('data-closing')){
                  top += 20;
              } else {
                  currentY += height + verticalSpacing;
              }
              element.css('top', top + 'px').css('margin-top','-' + (height+shadowHeight) + 'px').css('visibility','visible');
            }
          };

          $timeout(function(){
            layoutMessages();
          });

          if (duration > 0){
            $timeout(function(){
              scope.$close();
            }, duration);
          }
        }).error(function(data){
          throw new Error('Template specified for cgNotify ('+args.type+') could not be loaded. ' + data);
        });
      } catch(error) {
        console.log('Error loading the notification template: ', error.message);
      }

      var retVal = {};

      retVal.close = function(){
        if (scope.$close){
          scope.$close();
        }
      };

      Object.defineProperty(retVal,'message',{
        get: function(){
          return scope.$message;
        },
        set: function(val){
          scope.$message = val;
        }
      });

      return retVal;

    };

    Notifier.prototype.config = function(args) {
      startTop = !angular.isUndefined(args.startTop) ? args.startTop : startTop;
      verticalSpacing = !angular.isUndefined(args.verticalSpacing) ? args.verticalSpacing : verticalSpacing;
      duration = !angular.isUndefined(args.duration) ? args.duration : duration;
      defaultType = args.type ? args.type : defaultType;
      position = !angular.isUndefined(args.position) ? args.position : position;
      container = args.container ? args.container : container;
    };

    Notifier.prototype.closeAll = function() {
      for(var i = messageElements.length - 1; i >= 0; i --){
        var element = messageElements[i];
        element.css('opacity',0);
      }
    };

    return {
      notify: function(args) {
        return new Notifier().notify(args);
      },
      success: function(msg) {
        var params = { type: 'success', message: msg };
        return this.notify(params);
      },
      successHandler: function(msg) {
        var args = { type: 'success', message: msg };
        var self = this;
        return function() {
          return self.notify(args);
        };
      },
      error: function(msg) {
        var params = { type: 'error', message: _.string.capitalize(msg) };
        return this.notify(params);
      },
      errorHandler: function(error) {
        var args = { type: 'error', message: _.string.capitalize(error.error) };
        return new Notifier().notify(args);
      },
      info: function(msg) {
        var params = { type: 'info', message: msg };
        return this.notify(params);
      }
    };
  }
]);
