var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const alertCaption = require('./alertCaption.json');
const contractABI = require('./contracts/AthleteTokenABI.json');
var utils = {};
var eth = {};
var provider = '';
var gWeb3 = {};
var gUtils = {};
chainId = '';
Athlete = {
    web3: {},
    wallet: '',
    eth: {},
    utils: {},
    contractAddress: '',
    adminAddress: '',
    adminPrivateKey: '',
    AthleteContractInstance: {},
    accountWalletBalance: 0,

    init: function() {
        this.initWeb3();
    },
    initWeb3 : function() {

        $.getJSON('/api/v1/public/getethprovider', function(resp){
            if ( resp.provider == 'test' ) {
                self.contractAddress = resp.test_contract_address;
                self.adminAddress = resp.test_admin_address;
                self.adminPrivateKey = resp.test_admin_privatekey;
                provider = resp.test_provider;
                chainId = '0x03';
            }
            else {
                self.contractAddress = resp.main_contract_address;
                self.adminAddress = resp.main_admin_address;
                self.adminPrivateKey = resp.main_admin_privatekey;
                provider = resp.test_provider;
                chainId = '0x01';
            }
            gWeb3 = new Web3(new Web3.providers.HttpProvider(provider));
            gUtils = gWeb3.utils;

            if (typeof web3 !== 'undefined') {
                // web3 detected
                self.web3 = new Web3(web3.currentProvider);
                eth = self.web3.eth;
                utils = self.utils = self.web3.utils;
                self.eth = new Eth(web3.currentProvider);

                self.eth.accounts().then(function(accounts) {
                    if ( accounts.length >0 && accounts[0] != undefined && accounts[0] != '' ) {

                    }
                    else{
                        //self.showDialog('CryptoFantasy', alertCaption.metamask_locked);
                    }
                });
                //self.getBalance();
            }
            else {
                self.web3 = gWeb3;
                eth = self.web3.eth;
                self.utils = self.web3.utils;
                utils = self.utils;
                self.eth = new Eth(self.web3.currentProvider);
                //self.showDialog('CryptoFantasy', alertCaption.metamask_notinstalled+"<a href='https://metamask.io' target='_blank'>here</a>");
            }

            self.AthleteContractInstance = new self.web3.eth.Contract(contractABI, self.contractAddress);
//            gWeb3.eth.call({
//                data: self.AthleteContractInstance.methods.totalSupply().encodeABI()
//            }).then(function(result){
//console.log(result);
//            });
            self.AthleteContractInstance.methods.totalSupply().call().then(function(result){
                console.log('result', result);
            });
        });
    },
    checkedMetaMask : function() {
        self.eth.accounts().then(function(accounts) {
            if ( accounts.length >0 && accounts[0] != undefined && accounts[0] != '' ) {
                return false;
            }
            else{
                return true;
            }
        });
    },
    generateNewAddress: function() {
        var wallet = gWeb3.eth.accounts.create();
        return wallet;
    },
    createNewAthlete : function(athleteId, originWalletId, actualFee, siteFee, sellPrice) {
        self.eth.accounts().then(function(accounts) {
            if ( accounts.length >0 && accounts[0] != undefined && accounts[0] != '' ) {
                self.wallet = accounts[0];
                _createAthlete = self.AthleteContractInstance.methods.createOfAthleteCard(athleteId, originWalletId, actualFee, siteFee, utils.toWei(sellPrice)).send({
                    from: self.wallet
                });
                _createAthlete.on('transactionHash', function(hash){
                    console.log("transactionHash", hash);
                    self.web3.eth.getBlockTransactionCount(hash).then(console.log);
                })
                .on('receipt', function(receipt){
                    $.get('/api/v1/public/setathletetokenid/'+athleteId, { token_id: receipt.events.Birth.returnValues.tokenId, txHash: receipt.transactionHash, owner: receipt.events.Birth.returnValues.owner }, function(resp){
                        console.log(resp);
                    });
                    console.log('receipt', receipt);
                })
                .on('error', console.error);
            }
            else{
                self.showDialog('CryptoFantasy', alertCaption.metamask_locked);
            }
        });
    },
    createNewAthleteCardWithoutMetamask : function(athleteId, originWalletId, actualFee, siteFee, sellPrice, options, callback) {
        var gasPrice = gUtils.toHex(options.gasPrice);
        var gas = gUtils.toHex(options.gas);
        var _sellPrice = gUtils.toWei(sellPrice.toString());
        gWeb3.eth.getTransactionCount(self.adminAddress).then(function( count ){
            var data = self.AthleteContractInstance.methods.createOfAthleteCard(athleteId, originWalletId, actualFee, siteFee, _sellPrice).encodeABI();
            var rawTransaction = {from: self.adminAddress, nonce: gUtils.toHex(count), gasPrice: gasPrice, gas: gas, to: self.contractAddress, data: data, chainId: chainId };
            var privKey = new Buffer(self.adminPrivateKey, 'hex');
            var tx = new Tx(rawTransaction);
            tx.sign(privKey);
            var serializedTx = tx.serialize();
            gWeb3.eth.sendSignedTransaction('0x'+serializedTx.toString('hex'))
            .on('receipt', function(receipt){
                self.AthleteContractInstance.methods.totalSupply().call().then(function(_totalTokens){
                    var _lastTokenId = _totalTokens*1 - 1;
                    callback({status: 'success', tokenId: _lastTokenId});
                });
            })
            .on('error', function(error){
                callback({ status: 'error'});
            });
        });
    },

    /**
     * options - {from, value}
     * **/
    purchase: function(tokenId, options) {
        purchaseObj = self.AthleteContractInstance.methods.purchase(tokenId).send({from: options.from, value: utils.toWei(options.value, 'ether')});
        purchaseObj.on('transactionHash', function(hash){
            //$.get('/setathletestatustopending/'+options.athleteId, function(resp){
            //    console.log(resp);
            //});
            $.get('/buycontract/'+options.athleteId, { price: options.value }, function(resp){
                console.log(resp);
            });
            console.log("transactionHash", hash);
        })
        //.on('confirmation', function(confirmationNumber, receipt){
        //    $.get('/buycontract/'+options.athleteId, { price: options.value ,token_id: receipt.events.Birth.returnValues.tokenId,
        //        txHash: receipt.transactionHash,
        //        owner: receipt.events.Birth.returnValues.owner }, function(resp){
        //        console.log(resp);
        //    });
        //    console.log('confirmation', confirmationNumber, receipt);
        //})
        .on('receipt', function(receipt){
            // receipt example
            $.get('/buycontract/'+options.athleteId, { price: options.value ,token_id: receipt.events.Birth.returnValues.tokenId,
                txHash: receipt.transactionHash,
                owner: receipt.events.Birth.returnValues.owner }, function(resp){
                console.log(resp);
            });
            console.log('receipt', receipt);
        })
        .on('error', console.error);
    },
    /**
     * options - {from, value}
     * **/
    purchaseEx: function(tokenId, options, callback) {
        purchaseObj = self.AthleteContractInstance.methods.purchase(tokenId).send({from: options.from, value: utils.toWei(options.value.toString(), 'ether')});
        purchaseObj.on('transactionHash', function(hash){
            callback({result: 'hash', hash: hash});
        }).on('receipt', function(receipt){
            callback({result: 'receipt', receipt: receipt});
        })
        .on('error', function(error){
            callback({result: 'error', error: receipt});
        });
    },
    purchaseExWithoutMetamask : function (tokenId, price, options, callback) {
        var fromAddress = options.address;
        var fromPrivateKey = options.privatekey;
        var _sellPrice = gUtils.toHex(gUtils.toWei(price.toString()));
        var gasPrice = gUtils.toHex(options.gasPrice);
        var gas = gUtils.toHex(options.gas);

        gWeb3.eth.getTransactionCount(fromAddress).then(function(count){
            var data = self.AthleteContractInstance.methods.purchase(tokenId).encodeABI();
            var rawTransaction = {
                from: fromAddress, value: _sellPrice, to: self.contractAddress,
                nonce: gUtils.toHex(count), gasPrice: gUtils.toHex(gasPrice), gas: gUtils.toHex(gas), data: data, chainId: chainId
            };
            var privKey = new Buffer(fromPrivateKey, 'hex');
            if ( privKey.length == 0 ) {
                privKey = new Buffer(fromPrivateKey);
            }
            var tx = new Tx(rawTransaction);
            tx.sign(privKey);
            var serializedTx = tx.serialize();
            gWeb3.eth.sendSignedTransaction('0x'+serializedTx.toString('hex'))
            .on('transactionHash', function(hash){
                callback({result: 'hash', hash:hash});
            })
            .on('receipt', function(receipt){
                callback( { result: 'receipt', receipt: receipt });
            })
            .on('error', function(error){
                callback( { result: 'error', error: error });
            });
            //gWeb3.eth.sendSignedTransaction('0x'+serializedTx.toString('hex'), function(err, txHash){
            //    if ( err ) {
            //        callback({ result: 'fail', error: err });
            //    }
            //    else {
            //        callback( { result: 'success', hash: txHash });
            //    }
            //});
        });

    },
    getMetamaskWalletAddress: function(callback) {
        if ( window.web3 == undefined ) {
            callback('Not installed');
        }
        else {
            self.eth.accounts().then(function(accounts) {
                if ( accounts.length >0 && accounts[0] != undefined && accounts[0] != '' ) {
                    callback( accounts[0] );
                }
                else{
                    callback( 'Not logged-in yet' );
                    //self.showDialog('CryptoFantasy', alertCaption.metamask_locked);
                }
            });
        }
    },
    getBalance: function( address, callback ) {
        //console.log(eth);
        if ( address.substr(0,2) != '0x' ) {
            callback(0);
            return;
        }
        gWeb3.eth.getBalance(address).then(function(balance){
            callback(utils.fromWei(balance, 'ether') );
        }).catch(function(err){
            callback(0)
        });
    },
    createNewAddress: function() {

    },
    showDialog : function(captionStr, bodyStr) {
        $('#alertmodal_title').html(captionStr);
        $('#alertmodal_body').html(bodyStr);
        $('#alertModal').modal('show');
    }
}
let self = Athlete;