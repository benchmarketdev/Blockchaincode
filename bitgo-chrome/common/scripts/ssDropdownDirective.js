/**
* @ngdoc directive
* @name ssDropDown
* @description
* This module is a directive who is in charge of load a dropdown with the avaiable coins from
* the ssAPI, if an error happens will load only the bitcoin entry
* @return A dropdown with the available coins
* @example <ss-drop-down ignoreCoinsList="changeCoin" is-disabled="addressBeingGenerated" has-errors="unableToLoadAltCoins" alt="receiveAltCoin.altCoin" change="changeCoin" class="customSelect">
          </ss-drop-down>
*/
angular.module('BitGo.Common.SSDropDownDirective', [])
.directive('ssDropDown', ['$timeout', 'ssAPI','NotifyService',
  function ($timeout, ssAPI, NotifyService) {

    return {
      restrict: 'E',
      transclude: true,
      templateUrl: '/common/templates/ssDropdown.html',
      scope: {
        isDisabled: '=', //use 2-way binding instead.
        alt: '=',
        triggerChange: '=change',
        hasErrors: '=hasErrors'
      },

      link: function (scope, elem, attr) {
        // The search string to filter the dropdown list by
        scope.search = '';

        var AltCoins = {
          init : function(altCoins) {
            // Asign to our local property
            this.altCoins = [];

            // Should we ignore coins?
            for(index = 0; index < altCoins.length; index++) {
              if (_.isUndefined(scope.alt.ignoreList) || (scope.alt.ignoreList.indexOf(altCoins[index].name) === -1 && scope.alt.ignoreList.indexOf(altCoins[index].symbol) === -1)) {
                this.altCoins.push(altCoins[index]);
              }
            }
            scope.items = this.altCoins;
          },

          // The dropdown will load this coin in case of failure by calling the api
          getDefaultCoins: function() {
            return [{
              name:   'Bitcoin',
              symbol: 'BTC',
              image:  ssAPI.getCoinImage('BTC'),
              status: 'available'
            }];
          },
          display: function() {
            // Generate options
            var d = dropDownManager(scope,elem[0]);
            if (!_.isUndefined(attr.selected)) {
              var defaultCoin = ssAPI.getByName(attr.selected);
              if (defaultCoin !== null) {
                scope.coinImg   = defaultCoin.image;
                scope.coinName  = defaultCoin.name;
                scope.hasCoinSelected = true;
              }
            }

            scope.changeCoin = function(coin) {
              scope.coinImg = coin.image;
              scope.coinName= coin.name;
              scope.hasCoinSelected = true;
              d.toggleList();

              if (typeof scope.triggerChange === 'function') {
                scope.triggerChange(coin);
              }
            };

            scope.toggleList = function(){
              scope.search    = '';
              scope.filtering = false;
              d.toggleList();
            };

            scope.keypressFilter = function(event) {
              var char = String.fromCharCode(event.which);
              if (event.keyCode === 27) {
                d.hideFilter();
                d.toggleList(true);
                return;
              }
              // Only for the first letter, further times user will be typing on the input
              if(scope.search === ''){
                  scope.search += char;
              }
              d.filter.focus();
              d.showFilter();
            };

            scope.refresh = _.debounce(function() {
              d.load();
            }, 0);

          }
        };

        /**
        If an error ocurrs we want to show the toast to the user,
        and anyway load the dropdown with the Bitcoin value, so user can continue using
        the system :)
        @private
        @param err Object representing the error | String
        */
        var errorHandler = function(err) {
          if (!_.isUndefined(scope.hasErrors)) {
            scope.hasErrors = true;
          }
          // Show the error to the user
          var shiftError = ssAPI.getError(err);
          // If is an error that we don't have map yet, get the default
          if (shiftError === null) {
            shiftError = ssAPI.getError('defaultError');
          }
          // Show message on screen
          //NotifyService.error(shiftError.msg);
          var coinsContainer = document.getElementById("coins-container");
          while (coinsContainer.firstChild) {
            coinsContainer.removeChild(coinsContainer.firstChild);
          }
          // Init with just the bitcoin entry
          AltCoins.init(AltCoins.getDefaultCoins());
          // Display and compile the dropdown
          AltCoins.display();
        };

        // Make a call to the shapeshift API,
        // this method will return the available coins :)
        ssAPI.list().then(function(data) {
          // Shapeshift if something happens return an attribute instead of a http error
          // If no error!?
          if (_.isUndefined(data.error)) {
            // Init with the data from ShapeShift
            AltCoins.init(data);
            // Display and compile the dropdown
            AltCoins.display();
          } else {
            return errorHandler(data.error);
          }

        }).catch(errorHandler);

        // Dropdown component
        /**
        * Dropdown functionality, not dependent on library
        */
        function dropDownManager(scope, elem) {
          return {

            elem: elem,
            /**
            * HTML Element - Storarge for display element
            */
            display: {},
            /**
            * HTML Element - Wrapper for items list
            */
            arrow: {},
            /**
            * HTML Element - Up/down arrow
            */
            container: {},

            filter: {},

            /**
            * Store elements, bind events
            *
            * @param {object} elem Dropdown element
            */
            load: function() {
              this.display = this.elem.querySelector('.display');
              this.arrow = this.elem.querySelector('.arrow');
              this.container = this.elem.querySelector('.container');
              this.filter = this.elem.querySelector('.inputFilter');

              this.addHoverHandlers();
            },

            /**
            * Sets up the hover in and out handlers
            */
            addHoverHandlers: function() {
              var self = this;
              var timeoutId;

              function leave() {
                timeoutId = window.setTimeout(close, 500);
              }
              function enter() {
                window.clearTimeout(timeoutId);
              }
              function close() {
                self.toggleList(true);
              }

              self.display.addEventListener('mouseleave', leave);
              self.filter.addEventListener('mouseleave', leave);
              self.container.addEventListener('mouseleave', leave);
              self.display.addEventListener('mouseenter', enter);
              self.filter.addEventListener('mouseenter', enter);
              self.container.addEventListener('mouseenter', enter);
            },


          /**
          * Hide/show list
          * @param {boolean} boolean to show or close list
          */
          toggleList: function(close) {

            if (this.findClass(this.container, 'show') || close) {
              this.removeClass(this.container, 'show');
              this.removeClass(this.arrow, 'up');
              if (!this.findClass(this.arrow, 'down')) {
                this.addClass(this.arrow, 'down');
              }
              this.hideFilter();
            } else {
            //  this.setImages();
              this.addClass(this.container, 'show');
              this.removeClass(this.arrow, 'down');
              this.addClass(this.arrow, 'up');
            }
          },

          showFilter: function() {
            this.removeClass(this.filter, 'hide');
          },

          hideFilter: function() {
            this.removeClass(this.filter, 'hide');
            this.addClass(this.filter, 'hide');
          },

          /**
          * Adds a class to an element
          *
          * @param {object} elem HTML element
          * @param {string} className Class to add to element
          */
          addClass: function(elem, className) {
            elem.className = elem.className + ' ' + className;
          },
          /**
          * Removes a class to an element
          *
          * @param {object} elem HTML element
          * @param {string} className Class to remove from element
          */
          removeClass: function(elem, className) {
            var re = new RegExp('\\s*\\b' + className + '\\b');
            elem.className = elem.className.replace(re, '');
          },
          /**
          * Checks to see if element has class
          *
          * @param {object} elem HTML element
          * @param {string} className Class to find
          */
          findClass: function(elem, className) {
            var re = new RegExp('\\s*\\b' + className + '\\b');
            return re.test(elem.className);
          }
        };
      }
    }
  };
}]);
