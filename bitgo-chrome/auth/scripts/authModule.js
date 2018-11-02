/*
  About:
  - Deals with everything login, signup related
*/
angular.module('BitGo.Auth', [
  // Signup
  'BitGo.Auth.SignupController',
  'BitGo.Auth.SignupFormDirective',
  // Login
  'BitGo.Auth.LoginController',
  'BitGo.Auth.LoginFormDirective',
  'BitGo.Auth.SetPhoneFormDirective',
  'BitGo.Auth.TwoFactorFormDirective',
  'BitGo.Auth.ServicesAgreementFormDirective',

  // Logout
  'BitGo.Auth.LogoutController',
  // ResetPw
  'BitGo.Auth.ResetPwController',
  // ForgotPw
  'BitGo.Auth.ForgotPwController',
  'BitGo.Auth.ForgotPwFormDirective',
  // Verification
  'BitGo.Auth.VerifyEmailController'
]);
