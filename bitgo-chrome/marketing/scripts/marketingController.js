/**
 * @ngdoc controller
 * @name LandingController
 * @description
 * Manages logic for the BitGo main landing page
 */
angular.module('BitGo.Marketing.MarketingController', [])

.controller('MarketingController', ['$location', '$scope', '$rootScope', 'NotifyService', 'EnterpriseAPI', 'BG_DEV',
  function($location, $scope, $rootScope, NotifyService, EnterpriseAPI, BG_DEV) {

    // We have one controller for all of the marketing pages, so we track
    // context switches using this URL-context map
    var URL_CONTEXT_MAP = {
      '/': BG_DEV.APP_CONTEXTS.marketingHome,
      '/platform': BG_DEV.APP_CONTEXTS.marketingAPI,
      '/enterprise': BG_DEV.APP_CONTEXTS.marketingEnterprise,
      '/terms': BG_DEV.APP_CONTEXTS.marketingTerms,
      '/jobs': BG_DEV.APP_CONTEXTS.marketingJobs,
      '/p2sh_safe_address': BG_DEV.APP_CONTEXTS.marketingWhitePaper,
      '/insurance': BG_DEV.APP_CONTEXTS.marketingInsurance,
      '/privacy': BG_DEV.APP_CONTEXTS.marketingPrivacy,
      '/press': BG_DEV.APP_CONTEXTS.marketingPress,
      '/cases': BG_DEV.APP_CONTEXTS.marketingCases,
      '/about': BG_DEV.APP_CONTEXTS.marketingAbout,
      '/services_agreement': BG_DEV.APP_CONTEXTS.marketingServicesAgreement,
      '/sla': BG_DEV.APP_CONTEXTS.marketingSla,
      '/api-pricing': BG_DEV.APP_CONTEXTS.marketingApiPricing
    };

    $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;

    // the user info object that is submitted when someone inquires about API or platform
    $scope.userInfo = null;
    // ServicesAgreement change whenever new version is updated
    $scope.ServicesAgreementSource = 'marketing/templates/services_agreement_v1.html';

    // Slide quotes for the landing page
    $scope.slides = [
      {
        msg: 'BitGo is the only company in the industry we trust to secure our hot wallet.  The integration was very straightforward, and now I can sleep better at night knowing that my customers’ holdings are secured with BitGo.',
        person: 'Nejc Kodrič',
        company: 'Bitstamp',
        position: 'CEO'
      },
      {
        msg: 'The BitGo Platform API will be an integral part of our core infrastructure.  Our systems need to be highly secure, scalable and reliable, and BitGo is the only platform that can operate at those requirements.',
        person: 'Danny Yang',
        company: 'MaiCoin',
        position: 'CEO'
      },
      {
        msg: 'BitGo offers a robust API layer, making it much easier to integrate our clients\' multisig wallets. Their entire team was extremely helpful during the setup process.',
        person: 'Greg Schvey',
        company: 'TradeBlock',
        position: 'CEO'
      },
      {
        msg: 'Security is a top priority for us, and we are very excited about our partnership with BitGo, the recognized industry trend-setter for security of bitcoin storage and transactions.',
        person: 'Georgy Sokolov',
        company: 'e-Coin',
        position: 'Co-founder'
      },
      {
        msg: "The safety of our clients’ funds is our number one priority. BitGo's secure wallet and API allow us to innovate without compromising on our very high security standards.",
        person: 'Joe Lee',
        company: 'Magnr',
        position: 'CIO'
      }
    ];

    /**
    * Checks if form is valid befor esubmission
    * @private
    */
    function formIsValid() {
      return $scope.userInfo.email && $scope.userInfo.email !== '';
    }

    /**
    * Resets the platform/api inquiry form
    * @private
    */
    function resetForm() {
      $scope.userInfo = {
        company: "",
        email: "",
        industry: "",
        name: "",
        phone: ""
      };
    }

    /**
    * Sends a new enterprise inquiry to the marketing team
    * @public
    */
    $scope.onSubmitForm = function() {
      if (formIsValid()) {
        EnterpriseAPI.createInquiry($scope.userInfo)
        .then(function() {
          NotifyService.success('Your request was sent, and we\'ll be in touch with you soon.');
          resetForm();
        })
        .catch(function() {
          NotifyService.error('There was an issue with submitting your form. Can you please try that again?');
        });
      } else {
        NotifyService.error('Please fill in email address before submitting');
      }
    };

    function init() {
      $rootScope.setContext(URL_CONTEXT_MAP[$location.path()]);

      resetForm();
    }
    init();
  }
]);
