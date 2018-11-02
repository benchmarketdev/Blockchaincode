angular.module('BitGo.Common.BGInfiniteScrollService', [])
/**
  Service to handle setting/clearing the global infinite scroll handler

  Notes:
    When using the service in a controller, you'll want to set the scroll handler
    in some sort of init function

    Also, in that same controller, you'll also want to listen for the $destroy event
    and handler clearing the 'infiniteScrollHandler' from rootScope using the
    clearScrollHandler function

    Note: the infiniteScrollHandler function needs return a resolved/rejected promise

    Sample Usage:
    // someHandlerFn needs to return a promise
    InfiniteScrollService.setScrollHandler(someHandlerFn);

    $scope.$on('$destroy', function() {
      // remove listeners
      killStateWatch();
      // reset the global inifinte scroll handler
      InfiniteScrollService.clearScrollHandler();
    });
 */
.factory('InfiniteScrollService', ['$rootScope', '$timeout',
  function($rootScope, $timeout) {
    // this lets us know if there is a handler request in flight
    $rootScope.handlerRequestInFlight = false;

    // Handle the app's global (window) scroll event if there is one attached
    $rootScope.handleScroll = function() {
      // Don't allow subsequent handler calls while a request is out
      if (!$rootScope.infiniteScrollHandler || $rootScope.handlerRequestInFlight) {
        return;
      }
      $rootScope.handlerRequestInFlight = true;
      $rootScope.infiniteScrollHandler()
      .finally(function() {
        $rootScope.handlerRequestInFlight = false;
      });
    };

    function clearScrollHandler() {
      $rootScope.infiniteScrollHandler = null;
    }

    function setScrollHandler(handler) {
      if (!handler || typeof(handler) !== 'function') {
        throw new Error('Expected a function');
      }
      if ($rootScope.infiniteScrollHandler) {
        console.log('Existing scrollHandler on $rootScope -- overwriting with a new scrollHandler');
        clearScrollHandler();
      }
      $rootScope.infiniteScrollHandler = handler;
    }

    function init() {
      $rootScope.infiniteScrollHandler = null;
    }
    init();

    // In-client API
    return {
      setScrollHandler: setScrollHandler,
      clearScrollHandler: clearScrollHandler
    };
  }
]);
