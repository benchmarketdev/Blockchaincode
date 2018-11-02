// Module that manages match wallets and invitations
angular.module('BitGo.Matchwallet', [
  // Match Wallet State
  'BitGo.Matchwallet.MatchwalletController',
  // Settings
  'BitGo.Matchwallet.MatchwalletRewardWalletDirective',
  // Send Invitation Flow
  'BitGo.Matchwallet.MatchwalletSendManagerDirective',
  'BitGo.Matchwallet.MatchwalletSendStepsPrepareDirective',
  'BitGo.Matchwallet.MatchwalletSendStepsConfirmDirective'
]);