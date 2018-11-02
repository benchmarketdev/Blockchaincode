// Module that manages all wallet functionality in the app
angular.module('BitGo.Wallet', [
  // Overall Wallet State
  'BitGo.Wallet.WalletController',
  // Tx List Functionality
  'BitGo.Wallet.WalletTransactionsManagerDirective',
  'BitGo.Wallet.WalletTransactionWallettxTileDirective',
  'BitGo.Wallet.WalletTransactionHistoryTileDirective',
  'BitGo.Wallet.WalletApprovalTileDirective',
  // Receive BTC
  'BitGo.Wallet.WalletReceiveManagerDirective',
  'BitGo.Wallet.WalletReceiveCurrentReceiveAddressManager',
  'BitGo.Common.WalletReceiveAddressTileDirective',
  // Send BTC Flow
  'BitGo.Wallet.WalletSendManagerDirective',
  'BitGo.Wallet.WalletSendStepsTypeahead',
  'BitGo.Wallet.WalletSendStepsPrepareTxDirective',
  'BitGo.Wallet.WalletSendStepsConfirmTxDirective',
  // Create Wallet Flow
  'BitGo.Wallet.WalletCreateController',
  'BitGo.Wallet.WalletCreateStepsLabelDirective',
  'BitGo.Wallet.WalletCreateStepsBackupkeyDirective',
  'BitGo.Wallet.WalletCreateStepsPasscodeDirective',
  'BitGo.Wallet.WalletCreateStepsActivateDirective',
  // Policy
  'BitGo.Wallet.WalletPolicyManagerDirective',
  'BitGo.Wallet.WalletPolicySpendingLimitDirective',
  'BitGo.Wallet.WalletPolicyWhitelistManagerDirective',
  'BitGo.Wallet.WalletPolicyWhitelistAddDirective',
  'BitGo.Wallet.walletPolicyWhitelistTileDirective',
  // Users on wallet
  'BitGo.Wallet.WalletUsersManagerDirective',
  'BitGo.Wallet.WalletAddUserFormDirective',
  'BitGo.Wallet.WalletUserListDirective',
  'BitGo.Wallet.WalletPolicyWhitelistAddDirective',
  // Settings
  'BitGo.Wallet.WalletSettingsManagerDirective',
  'BitGo.Wallet.WalletSettingsGeneralFormDirective',
  'BitGo.Wallet.WalletSettingsPasscodeFormDirective',
  // Recovery
  'BitGo.Wallet.WalletRecoverController',
  // Dependencies
  'BitGo.API.SDK'
]);
