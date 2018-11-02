angular.module('BitGo.Enterprise.AuditLogActivityTileDirective', [])
/**
 * Manages the logic for ingesting an audit log item and outputting
 * the right template item to the DOM
 */
.directive('auditLogActivityTile', ['$compile', '$http', '$templateCache', 'BG_DEV',
  function($compile, $http, $templateCache, BG_DEV) {
    // Returns the template path to compile based on logItem.type
    /* istanbul ignore next */
    var getTemplate = function(logItemType) {
      var template = '';
      switch(logItemType) {
        // User Auth
        case 'userSignup':
        case 'userLogin':
        case 'userFailedLogin':
        // Transactions
        case 'bitgoSigned':
        case 'createTransaction':
        case 'approveTransaction':
        case 'rejectTransaction':
        // Policy Changes
        case 'changePolicy':
        case 'approvePolicy':
        case 'rejectPolicy':
        // User Shares
        case 'removeUser':
        case 'shareUser':
        case 'shareUserAccept':
        case 'shareUserCancel':
        case 'shareUserDecline':
        case 'approveUser':
        case 'rejectUser':
        // User Settings change
        case 'userSettingsChange':
        case 'userPasswordChange':
        case 'userPasswordReset':
        // Wallet Actions
        case 'createWallet':
        case 'removeWallet':
        case 'renameWallet':
        // Label Address
        case 'labelAddress':
        // Commenting
        case 'updateComment':
        // organizations
        case 'createEnterprise':
        // TODO: Barath. Fill all these in after backend changes
        case 'updateEnterpriseUser':
        case 'approveEnterpriseUser':
        case 'rejectEnterpriseUser':
        case 'updateEnterpriseSupport':
        case 'updateEnterpriseCredit':
        case 'updateEnterpriseUserPrice':
        // organization approvals                
        case 'acceptEnterpriseUser':
        case 'rejectEnterpriseUser':
          template = 'enterprise/templates/activitytiles/' + logItemType + '.html';
          break;
        default:
          throw new Error('Expected valid audit log type. Got: ' + logItemType);
      }
      return template;
    };

    // Note:
    // We work in the link function because we need to specify the
    // template before compile time; then manually compile it once we have
    // data on the scope
    /* istanbul ignore next */
    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element, attrs) {
        // backupsource constants are set on the scope so they be accessed from html
        scope.backupSource = BG_DEV.AUDIT_LOG.BACKUP_KEY_METHODS;

        function checkPolicyItem(logItemType) {
          switch(logItemType) {
            case 'changePolicy':
            case 'removePolicy':
            case 'approvePolicy':
            case 'rejectPolicy':
              return true;
            default:
              return false;
          }
        }

        // Set pretty time for the ui
        scope.logItem.prettyDate = new moment(scope.logItem.date).format('MMMM Do YYYY, h:mm:ss A');
        // Bool for if the action is a policy item
        scope.logItem.isPolicyItem = checkPolicyItem(scope.logItem.type);
        // Plans get the plans so that plan changes can be displayed
        scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;

        // init the template
        $http.get(getTemplate(scope.logItem.type), {cache: $templateCache})
        .success(function(html) {
          element.html(html);
          $compile(element.contents())(scope);
        });

      }
    };
  }
]);
