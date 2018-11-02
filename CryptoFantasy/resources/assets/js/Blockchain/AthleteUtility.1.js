import { Buffer } from 'buffer';

var Web3 = require('web3');
var ethUtil = require('ethereumjs-util');
var BigNumber = require('bignumber.js');
var tx = require('ethereumjs-tx');
var lightWallet = require('eth-lightwallet');
var txUtils = lightWallet.txutils;

//var ethContracts = require('ethereum-contracts');
// var truffleContract = require('truffle-contract');
// var ethers = require('ethers');

var config = require('./config/config.json');
var contractABI = require('./contracts/AthleteToken.json');
var _bytecode = require('./contracts/AthleteToken.bytecode.json');

AthleteUtility = {
    web3: null,
    connected_ipc: '',
    userWalletId: '',
    contracts: {},
    provider: null,
    factory: null,
    Athlete: {},
    contractAddress: '',
    contractPrivateKey: '',
    contractABI: null,
    contractByteCode: null,
    // adminPrivateKey: '0x107151f3df2a2b4960f584d12de8c1a82ea8259e229e1c2b140fdfd3b4d58c88',

    init : function(type) {
        this.initWeb3(type);
        this.setConfig();
        // this.initContract();
        // this.getUserWalletId();
    },
    initWeb3 : function( type ) {
        if ( type == 'test' ) 
            self.web3 = new Web3(new Web3.providers.HttpProvider(config.ethTestProvider));
        else
            self.web3 = new Web3(new Web3.providers.HttpProvider(config.ethLiveProvider));
        console.log(self.web3);
    },
    setConfig: function() {
        self.contractABI = contractABI;
        self.contractByteCode = _bytecode.bytecode;

        self.contractAddress = config.contractAddress;
        self.contractPrivatekey = config.privateKey;

        var rawTx = {
            nonce: self.web3.toHex(self.web3.eth.getTransactionCount(self.contractAddress)),
            gasLimit: web3.toHex(8000000),
            gasPrice: self.web3.toHex(20000000000),
            data: '0x' + contractByteCode
        };

        this.sendRaw(rawTx);
    },
    sendRaw : function(rawTx) {
        var privateKey = new Buffer(self.contractPrivatekey, 'hex');
        var transaction = new tx(rawtx);
        transaction.sign(privateKey);
        var serializedTx = transaction.serialize().toString('hex');
        self.web3.eth.sendRawTransaction('0x'+serializedTx, function(err, result){
            if (err) {
                console.log(err);
            }
            else {
                console.log(result);
            }
        });
    },
    initContract : function() {
        self.web3.eth.contract(self.contractABI).at(self.contractAddress).then(function(instance){
            self.Athlete = instance;
            console.log(self.Athlete);
        });
        //console.log(self.Athlete);
        //var wallet = new ethers.Wallet(self.adminPrivateKey, self.provider);
        //self.contracts.Athlete = new ethers.Contract(self.contractAddress, self.contractABI, wallet);
//console.log(self.contracts.Athlete);
    },
    setAdminWalletPrivateKey: function(_privateKey) {
        self.adminPrivateKey = _privateKey;
    },
    createAthleteToToken: function( athlete_info ) {
        var _athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice;
        _athleteId = athlete_info.athleteId;
        _originWalletId = athlete_info.originWalletId;
        _actualFee = athlete_info.actualFee;
        _siteFee = athlete_info.siteFee;
        _sellPrice = self.web3.toWei(athlete_info.sellPrice, 'ether')*1;
//console.log(_sellPrice); return;

        //var _contract = self.web3.eth.contract(self.contractABI).at(self.contractAddress);
        //_contract.createContractOfAthlete(_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice).then(function(result){
        //    console.log(result);
        //}).catch(function(err){
        //    console.log(err);
        //});
//console.log(_contract);
//        alert(_originWalletId)
//        console.log(99,self.contracts.Athlete);


        createTokenPromise = self.Athlete.createContractOfAthlete(_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice);
        createTokenPromise.then(function(result){
            console.log(result);
            //tokenIdInfo = new BigNumber(result.logs[0].args.tokenId);
            //token_id = tokenIdInfo.toString();
            //$.getJSON('/setathletetokenid/'+athleteId+'?token_id='+ token_id, function(resp){
            //
            //});
            //console.log(result);
        }).catch(function(err){
            console.log(_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice);
            console.log(err);
        });

    },
    getTransactionCount: function(address) {
        self.provider.getTransactionCount(address).then(function(transactionCount) {
            return {status: 'success', count: transactionCount};
        }).catch(function(err){
            return {status: 'error', message: err.message};
        });
    },
    getAdminUserWalletInfo: function() {

    },
    getUserWalletId: function() {
        $.getJSON('/accountinfo', function(userInfo){
            self.userWalletId = userInfo.wallet_id;
        });
    },
    getBalance : function(address, callback) {
        var url = "https://api.etherscan.io/api?module=account&action=balance&address=" + address + "&tag=latest";
        $.getJSON(url, function(resp) {
            if (resp.result == '0') callback(0);
            else {
                balance = new BigNumber(resp.result);
                _balance = self.weiToEth(balance);
                callback(_balance);
            }
        });
        //self.provider.getBalance(address).then(function(balance) {
        //
        //    // balance is a BigNumber (in wei); format is as a sting (in ether)
        //    var etherString = ethers.utils.formatEther(balance);
        //    callback(etherString);
        //    console.log("Balance: " + etherString);
        //});
    },
    weiToEth : function(weiIn, divisorIn, fixIn) {
        var fix = fixIn || 5,
            wei = new BigNumber(String(weiIn)),
            divisor = new BigNumber(divisorIn ? divisorIn : 1e18);
        return fixIn ? wei.div(divisor).toNumber().toFixed(fix) : wei.div(divisor).toNumber();
    },
    createAthlete: function() {

    }
}


var self = AthleteUtility;