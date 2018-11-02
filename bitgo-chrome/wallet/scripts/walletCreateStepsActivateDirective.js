/**
  Directive to manage the wallet activation step
  - Parent Controller is WalletCreateController
  - Manages generation/download of the Wallet Backup PDF
 */
angular.module('BitGo.Wallet.WalletCreateStepsActivateDirective', [])

.directive('walletCreateStepsActivate', ['$rootScope', '$location', '$timeout', 'NotifyService', 'WalletsAPI', 'AnalyticsProxy',
  function($rootScope, $location, $timeout, NotifyService, WalletsAPI, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // Determine if the user can activate the wallet
        $scope.canActivate = function() {
          return $scope.inputs.activationCodeConfirm &&
                  $scope.inputs.activationCodeConfirm.toString() === $scope.generated.activationCode.toString();
        };

        $scope.wrongActivationCode = function() {
          return ($scope.inputs.activationCodeConfirm &&
                 $scope.inputs.activationCodeConfirm.toString() !== $scope.generated.activationCode.toString()) &&
                 $scope.inputs.activationCodeConfirm.toString().length === $scope.generated.activationCode.toString().length;
        };

        // Creates the wallet based on the 3 keychains generated previously
        function createWallet() {
          var params = {
            label: $scope.inputs.walletLabel,
            xpubs: [
              $scope.generated.walletKeychain.xpub,
              $scope.generated.walletBackupKeychain.xpub,
              $scope.generated.bitgoKeychain.xpub
            ]
          };
          return WalletsAPI.createSafeHD(params);
        }

        // Function to generate a client-side wallet PDF backup that contains
        // information needed to recover the wallet
        function downloadBackup() {
          try {
            // Create the activation code
            if (!$scope.generated.activationCode) {
              // If we're running e2e tests the port will be 7883
              // If this is the case, set the generation code to 1000
              if ($location.port() === 7883) {
                $scope.generated.activationCode = 1000;
              } else {
                $scope.generated.activationCode = Math.floor(Math.random() * 900000 + 100000);
              }
            }

            // Create the initial details for generating the backup PDF
            var date = new Date().toDateString();
            var pdfTitle = "BitGo Keycard for " + $scope.inputs.walletLabel + ".pdf";

            // PDF Basics
            // fonts
            var font = {
              header: 24,
              subheader: 15,
              body: 12
            };
            // colors
            var color = {
              black: '#000000',
              darkgray: '#4c4c4c',
              gray: '#9b9b9b',
              red: '#e21e1e'
            };
            // document details
            var width = 8.5 * 72;
            var margin = 30;
            var y = 0;

            // Helpers for data formatting / positioning on the paper
            var left = function(x) {
              return margin + x;
            };

            var moveDown = function(ydelta) {
              y += ydelta;
            };

            var reformatJSON = function(json) {
              return JSON.stringify(JSON.parse(json), null, 2).replace('\t', '  ');
            };

            // Create the PDF instance
            var doc = new jsPDF('portrait','pt','letter');
            doc.setFont("helvetica");

            // PDF Header Area - includes the logo and company name
            // This is data for the BitGo logo in the top left of the PDF
            moveDown(30);
            // Bitgo shield is 30x36
            doc.addImage('data:image/png;base64,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', left(0), y);
            moveDown(8);
            doc.setFontSize(font.body).setTextColor(color.gray);
            doc.text('Activation Code', left(460), y);
            doc.setFontSize(font.header).setTextColor(color.black);
            moveDown(22);
            doc.text('BitGo KeyCard', left(35), y);
            doc.setFontSize(font.header).setTextColor(color.gray);
            doc.text($scope.generated.activationCode.toString(), left(460), y);

            // Subheader
            // titles
            moveDown(margin);
            doc.setFontSize(font.body).setTextColor(color.gray);
            doc.text('Created on ' + date + ' for wallet named:', left(0), y);
            // copy
            moveDown(25);
            doc.setFontSize(font.subheader).setTextColor(color.black);
            doc.text($scope.inputs.walletLabel.toString(), left(0), y);
            // doc.text($scope.generatedActivationCode.toString(), left(392), y);
            // Red Bar
            moveDown(20);
            doc.setFillColor(255, 230, 230);
            doc.rect(left(0), y, width - 2 * margin, 32, 'F');

            // warning message
            moveDown(20);
            doc.setFontSize(font.body).setTextColor(color.red);
            doc.text('Print this document, or keep it securely offline. See second page for FAQ.', left(75), y);

            // PDF QR Code data
            var qrdata = {
              user: {
                title: 'A: User Key',
                img: '#qrEncryptedUserKey',
                desc: 'This is your private key, encrypted with your passcode.',
                data: $scope.generated.walletKeychain.encryptedXprv
              },
              bitgo: {
                title: 'C: BitGo Public Key',
                img: '#qrBitgoKey',
                desc: 'This is the public half of the key BitGo has generated for this wallet.',
                data: $scope.generated.bitgoKeychain.xpub
              },
              passcode: {
                title: 'D: Encrypted Wallet Password',
                img: '#qrEncryptedWalletPasscode',
                desc: 'This is the wallet password, encrypted client-side with a key held by BitGo.',
                data: $scope.generated.encryptedWalletPasscode
              }
            };
            // Backup entry depends on who supplied the xpub
            if ($scope.inputs.backupKeyProvider) {
              var backupKeyProviderName = $scope.inputs.backupKeyProviderDisplayName();
              var backupKeyProviderUrl = $scope.inputs.backupKeyProviderUrl();
              // User supplied the xpub
              qrdata.backup = {
                title: 'B: Backup Key',
                img: '#qrEncryptedUserProvidedXpub',
                desc:
                  'This is the public half of your key held at ' + backupKeyProviderName + ', a key recovery service. \r\n' +
                  'For more information visit: ' + backupKeyProviderUrl,
                data: $scope.generated.walletBackupKeychain.xpub
              };
            } else if ($scope.inputs.useOwnBackupKey) {
              // User supplied the xpub
              qrdata.backup = {
                title: 'B: Backup Key',
                img: '#qrEncryptedUserProvidedXpub',
                desc: 'This is the public portion of your backup key, which you provided.',
                data: $scope.generated.walletBackupKeychain.xpub
              };
              // update description for backup keys generated from ColdKey app
              if ($scope.inputs.coldKey === $scope.inputs.backupPubKey) {
                qrdata.backup.desc = 'This is the public portion of your backup key generated using BitGo KeyTool.';
              }
            } else {
              // User generated in the current session
              qrdata.backup = {
                title: 'B: Backup Key',
                img: '#qrEncryptedBackupKey',
                desc: 'This is your backup private key, encrypted with your passcode.',
                data: $scope.generated.walletBackupKeychain.encryptedXprv
              };
            }
            // Generate the first page's data for the backup PDF
            moveDown(35);
            var qrSize = 130;
            ['user', 'backup', 'bitgo', 'passcode'].forEach(function(name) {
              var qr = qrdata[name];
              var topY = y;
              var textLeft = left(qrSize + 15);
              doc.addImage($(qr.img + ' img').attr('src'), left(0), y, qrSize, qrSize);
              doc.setFontSize(font.subheader).setTextColor(color.black);
              moveDown(10);
              doc.text(qr.title, textLeft, y);
              moveDown(15);
              doc.setFontSize(font.body).setTextColor(color.darkgray);
              doc.text(qr.desc, textLeft, y);
              moveDown(30);
              doc.setFontSize(font.body - 2);
              doc.text('Data:', textLeft, y);
              moveDown(15);
              var width = 72*8.5 - textLeft - 30;
              doc.setFont('courier').setFontSize(9).setTextColor(color.black);
              var lines = doc.splitTextToSize(qr.data, width);
              doc.text(lines, textLeft, y);
              doc.setFont('helvetica');
              // Move down the size of the QR code minus accumulated height on the right side, plus buffer
              moveDown(qrSize - (y - topY) + 15);
            });

            // Add 2nd Page
            doc.addPage();

            // 2nd page title
            y = 0;
            moveDown(55);
            doc.setFontSize(font.header).setTextColor(color.black);
            doc.text('BitGo KeyCard FAQ', left(0), y);

            // Questions data for 2nd page
            var questions = [
              {
                q: 'What is the KeyCard?',
                a:
                [
                  'The KeyCard contains important information which can be used to recover the bitcoin ',
                  'from your wallet in several situations. Each BitGo wallet has its own, unique KeyCard. If you ',
                  'have created multiple wallets, you should retain the KeyCard for each of them.'
                ],
              },
              {
                q: 'What should I do with it?',
                a:
                [
                  'You should print the KeyCard and/or save the PDF to an offline storage device. The print-out ',
                  'or USB stick should be kept in a safe place, such as a bank vault or home safe. It\'s a good idea ',
                  'to keep a second copy in a different location.',
                  '',
                  'Important: If you haven\'t provided an external backup key, then the original PDF should be ',
                  'deleted from any machine where the wallet will be regularly accessed to prevent malware from ',
                  'capturing both the KeyCard and your wallet passcode.'
                ],
              },
              {
                q: 'What should I do if I lose it?',
                a:
                [
                  'If you have lost or damaged all copies of your KeyCard, your bitcoin is still safe, but this ',
                  'wallet should be considered at risk for loss. As soon as is convenient, you should use BitGo ',
                  'to empty the wallet into a new wallet, and discontinue use of the old wallet.'
                ],
              },
              {
                q: 'What if someone sees my KeyCard?',
                a:
                [
                  'Don\'t panic! All sensitive information on the KeyCard is encrypted with your passcode, or with a',
                  'key which only BitGo has. But, in general, you should make best efforts to keep your ',
                  'KeyCard private. If your KeyCard does get exposed or copied in a way that makes you ',
                  'uncomfortable, the best course of action is to empty the corresponding wallet into another ',
                  'wallet and discontinue use of the old wallet.'
                ],
              },
              {
                q: 'What if I forget or lose my wallet password?',
                a:
                [
                  'BitGo can use the information in QR Code D to help you recover access to your wallet. ',
                  'Without the KeyCard, BitGo is not able to recover funds from a wallet with a lost password.'
                ],
              },
              {
                q: 'What if BitGo becomes inaccessible for an extended period?',
                a:
                [
                  'Your KeyCard and wallet passcode can be used together with BitGo’s published open ',
                  'source tools at https://github.com/bitgo to recover your bitcoin. Note: You should never enter ',
                  'information from your KeyCard into tools other than the tools BitGo has published, or your ',
                  'funds may be at risk for theft.'
                ],
              },
              {
                q: 'Should I write my wallet password on my KeyCard?',
                a:
                [
                  'No! BitGo’s multi-signature approach to security depends on there not being a single point ',
                  'of attack. But if your wallet password is on your KeyCard, then anyone who gains access to ',
                  'your KeyCard will be able to steal your bitcoin. We recommend keeping your wallet password ',
                  'safe in a secure password manager such as LastPass, 1Password or KeePass.'
                ],
              }
            ];

            // Generate the second page's data for the backup PDF
            moveDown(30);
            questions.forEach(function(q) {
              doc.setFontSize(font.subheader).setTextColor(color.black);
              doc.text(q.q, left(0), y);
              moveDown(20);
              doc.setFontSize(font.body).setTextColor(color.darkgray);
              q.a.forEach(function(line) {
                doc.text(line, left(0), y);
                moveDown(font.body + 3);
              });
              moveDown(22);
            });

            // Save the PDF on the user's browser
            doc.save(pdfTitle);
          } catch(error) {
            NotifyService.error('There was an error generating the backup PDF. Please refresh your page and try this again.');

            // track the failed wallet backup download
            var metricsData = {
              // Error Specific Data
              status: 'client',
              message: error,
              action: 'DownloadKeyCard'
            };
            AnalyticsProxy.track('Error', metricsData);
          }
        }

        // Downloads another copy of the same wallet backup PDF generated when
        // this directive initially loaded
        $scope.download = function() {
          downloadBackup();

          // track the additional download
          AnalyticsProxy.track('DownloadKeyCard');
        };

        // Creates the actual wallet
        $scope.activateWallet = function() {
          // clear any errors
          $scope.clearFormError();
          if ($scope.canActivate()) {
            createWallet()
            .then(function(wallet) {
              // Note: wallet is a fully decorated client wallet object

              // Track successful wallet creation
              var metricsData = {
                walletID: wallet.data.id,
                walletName: wallet.data.label
              };
              AnalyticsProxy.track('CreateWallet', metricsData);

              $scope.generated.wallet = wallet;
              // Get the latest wallets for the app
              WalletsAPI.getAllWallets();

              // redirect to the wallets dashboard
              $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
            })
            .catch();
          } else {
            $scope.setFormError('Please enter a the activation code from your backup.');

            // track the failed wallet activation
            var metricsData = {
              // Error Specific Data
              status: 'client',
              message: 'Invalid Activation Code',
              action: 'CreateWallet'
            };
            AnalyticsProxy.track('Error', metricsData);
          }
        };

        function init() {
          // force the client to download a backup when this step initializes
          // wait for the html to load before downloading -- we need to pull qrcode
          // data off the tempalte or the PDF generator will throw;
          $timeout(function() {
            $scope.download();
          }, 1000);
        }
        init();
      }]
    };
  }
]);
