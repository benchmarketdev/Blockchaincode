/*
  About:
  - The BitGo.Settings module is the main module that deals with the main
  app user's account information, settings, and state
*/
angular.module('BitGo.Settings', [
  // Modules for BitGo.Settings composition
  'BitGo.Settings.ProfileFormDirective',
  'BitGo.Settings.DevelopersFormDirective',
  'BitGo.Settings.DevelopersAccesstokenAddFormDirective',
  'BitGo.Settings.DevelopersManagerDirective',
  'BitGo.Settings.PreferencesFormDirective',
  'BitGo.Settings.SettingsController',
  'BitGo.Settings.SecurityManagerDirective',
  'BitGo.Settings.PasswordFormDirective'
]);
