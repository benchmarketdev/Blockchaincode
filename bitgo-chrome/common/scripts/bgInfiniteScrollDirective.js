angular.module('BitGo.Common.BGInfiniteScrollDirective', [])
/**
 * Directive to handle autoscrolling on a page - triggers information fetch
 * when the bottom gets within range of the element's height
 */
.directive('bgInfiniteScroll', ['$parse', '$timeout', '$rootScope',
  function($parse, $timeout, $rootScope) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        var element = elem[0];
        // We scroll the entire page, so we need the window element
        $(window).scroll(function() {
          if ($(document).scrollTop() + element.offsetHeight >= element.scrollHeight - 250) {
            // Do not allow handler calls when a request is in flight
            if ($rootScope.handlerRequestInFlight) {
              return;
            }
            scope.$apply(attrs.whenScrolled);
          }
        });
      }
    };
  }
]);
