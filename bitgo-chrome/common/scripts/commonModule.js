/*
  Notes:
  - All BitGo directives are namespaced with BG to make a
  clear distinction between HTML attrs, other libraries,
  and BitGo's library code.
  OK: bg-focus-when || Not OK: focus-when

  - The BitGo.Common module is intended to be used throughout the app and
  should not be composed of (have dependencies on) any other modules
  outside of those in the BitGo.Common namespace.
*/
angular.module('BitGo.Common', [
  // Modules for BitGo.Common composition
  'BitGo.Common.BGActivityTilePolicyDescriptionDirective',
  'BitGo.Common.BGAddUserToWalletDirective',
  'BitGo.Common.BGApprovalsFilter',
  'BitGo.Common.BGApprovalTileEnterpriseRequestDirective',
  'BitGo.Common.BGApprovalTileInvitation',
  'BitGo.Common.BGApprovalTilePolicyRequestDirective',
  'BitGo.Common.BGApprovalTileTxRequestDirective',
  'BitGo.Common.BGBitcoinFormatFilter',
  'BitGo.Common.BGBitcoinToCurrencyFilter',
  'BitGo.Common.BGCapitalizeFilter',
  'BitGo.Common.BGCenterEllipsisFilter',
  'BitGo.Common.BGConfirmActionDirective',
  'BitGo.Common.BGCreditCardForm',
  'BitGo.Common.BGDecimalFormatFilter',
  'BitGo.Common.BGDynamicTableRowManagerDirective',
  'BitGo.Common.BGEnterpriseOrderingFilter',
  'BitGo.Common.BGEnterpriseWalletsByUser',
  'BitGo.Common.BGFormError',
  'BitGo.Common.BGFocusUiDirective',
  'BitGo.Common.BGFocusWhen',
  'BitGo.Common.BGGetAddressLabelDirective',
  'BitGo.Common.BGGetLocalWalletDirective',
  'BitGo.Common.BGGetUser',
  'BitGo.Common.BGGravatarDirective',
  'BitGo.Common.BGInfiniteScrollDirective',
  'BitGo.Common.BGInfiniteScrollService',
  'BitGo.Common.BGInputNumbersOnly',
  'BitGo.Common.BGInputToSatoshiConverterDirective',
  'BitGo.Common.BGInputValidator',
  'BitGo.Common.BGIsObjectEmptyFilter',
  'BitGo.Common.BGIntlTelInputDirective',
  'BitGo.Common.BGJsonDecryptDirective',
  'BitGo.Common.BGListActiveTileManagerDirective',
  'BitGo.Common.BGOrderObjectsByFilter',
  'BitGo.Common.BGOtpDevicesDirective',
  'BitGo.Common.BGPasswordStrength',
  'BitGo.Common.BGPermissionsRoleConversionFilter',
  'BitGo.Common.BGPolicyIdStringConversionFilter',
  'BitGo.Common.BGQrCode',
  'BitGo.Common.BGStateManager',
  'BitGo.Common.BGTimePeriodSelect',
  'BitGo.Common.BGTimezoneSelect',
  'BitGo.Common.BGTypeaheadTriggerDirective',
  'BitGo.Common.BGWalletPermissionsDirective',
  'BitGo.Common.BGWalletSharesByWalletFilter',
  'BitGo.Common.BGWalletsByRoleFilter',
  'BitGo.Common.BGWalletSharesByWalletFilter',
  'BitGo.Common.SSDropDownDirective',

  // Dependencies
  'BitGo.API.SDK'
]);
