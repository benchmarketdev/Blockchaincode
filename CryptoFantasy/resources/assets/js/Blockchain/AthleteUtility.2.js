var Web3 = require('./web3.min.js');
var ethUtil = require('ethereumjs-util');
var BigNumber = require('bignumber.js');
var Buffer = require('buffer').Buffer;
var tx = require('ethereumjs-tx');
var lightWallet = require('eth-lightwallet');
var txUtils = lightWallet.txutils;

//var ethContracts = require('ethereum-contracts');
// var truffleContract = require('truffle-contract');
// var ethers = require('ethers');

var config = require('./config/config.json');
var contractABI = require('./contracts/AthleteToken.json');
var _bytecode = require('./contracts/AthleteToken.bytecode.json');
var ethUtils = {};
var address = "0xBFe96b35E3E08d4ABe6a9022b2363922092A4751";

AthleteUtility = {
    web3: null,
    connected_ipc: '',
    userWalletId: '',
    contracts: {},
    provider: null,
    factory: null,
    Athlete: {},
    contractAddress: '',
    privateKey: '',
    contractABI: null,
    contractByteCode: null,
    contractInstance: {},
    // adminPrivateKey: '0x107151f3df2a2b4960f584d12de8c1a82ea8259e229e1c2b140fdfd3b4d58c88',

    init : function() {
        this.initWeb3();
        this.setConfig();
        this.initContract();
        // this.getUserWalletId();
    },
    initWeb3 : function() {
        if ( config.ethProviderType == 'test' ) 
            self.web3 = new Web3(new Web3.providers.HttpProvider(config.ethTestProvider));
        else
            self.web3 = new Web3(new Web3.providers.HttpProvider(config.ethLiveProvider));

            ethUtils = self.web3.utils;
        console.log(self.web3);
    },
    setConfig : function() {
        self.contractABI = contractABI;
        self.contractByteCode = _bytecode.bytecode;

        self.contractAddress = config.contractAddress;
        self.privateKey = "8ddd4ecc089c81801b2c7f0e6485d6abac08f178cf4abfbe26427de86a7b72bd";
        
        // self.deployContract('0xBFe96b35E3E08d4ABe6a9022b2363922092A4751', '0d97d178c437c3c7bda56e17c606d59bc1562b5af43f8ea298f78e92ea573a75');
    },
    deployContract: function(_address, _privatekey) {
        var rawTx = {
            nonce: ethUtils.toHex(self.web3.eth.getTransactionCount(_address)),
            gasLimit: ethUtils.toHex(3000000),
            gasPrice: ethUtils.toHex(20000000000),
            data: self.contractByteCode
        };
console.log(rawTx);
        // this.sendRaw(rawTx, _privatekey);

    },
    sendRaw : function(rawTx,_privatekey) {
        var privateKey = new Buffer(_privatekey, 'hex');
        var transaction = new tx(rawTx);
        transaction.sign(privateKey);
        var serializedTx = transaction.serialize().toString('hex');
        // console.log(serializedTx);
        self.web3.eth.sendRawTransaction('0x'+serializedTx, function(err, result){
            if (err) {
                console.log('error is following', err);
            }
            else {
                // result was tx hash code. = 0xc43a777aa1756ccaa1cd8e7228704727494b050f5f05f83a500537d2f0d6714f
                // contract address was 0xC97DBe0e9EbdD390f3A0247449f54E355B260feB.
                console.log('result is', result);
                
                self.contractInstance.totalSupply.call(function(err, result){
                    if (err) {
                        console.log(err);
                    }
                    else{
                        console.log(result);
                    }
                });
            }
        });
    },
    initContract : function() {
        var contract = new self.web3.eth.Contract(contractABI, self.contractAddress);
        self.contractInstance = contract;
//         contract.deploy({data: self.contractByteCode}).send({from: address, gas: 1500000, gasPrice: '30000000000'}, function(result){
// console.log(result);
//         });
// console.log(self.contractInstance)
        // self.contractInstance.methods.symbol().call(function(err, result){
        //     if (err) {
        //         console.log(err);
        //     }
        //     else{
        //         console.log(result);
        //     }
        // });
    },
    createAthleteToToken: function( athlete_info ) {
        var _athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice;
        _athleteId = athlete_info.athleteId;
        _originWalletId = athlete_info.originWalletId;
        _actualFee = athlete_info.actualFee;
        _siteFee = athlete_info.siteFee;
        _sellPrice = ethUtils.toWei(athlete_info.sellPrice, 'ether')*1;

        // var params = [_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice];
        var txOptions = {
            from: address,
            gasLimit: ethUtils.toHex(300000),
            gasPrice: ethUtils.toHex(20000000000),
            // to: self.contractAddress
        };
        // var rawTx = txUtils.functionTx(contractABI, 'createContractOfAthlete', params, txOptions);
        // self.sendRaw(rawTx, self.privateKey)
        // self.web3.eth.defaultAccount = address;
console.log(self.contractInstance);
        self.contractInstance.methods.createContractOfAthlete(_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice).send({from: address}, function(error, result){
            if (error) {
                console.log('error is ', error);
            } else {
                console.log('Result :', result);
            }
        });
        

    },
    getTransactionCount: function(address) {
        self.provider.getTransactionCount(address).then(function(transactionCount) {
            return {status: 'success', count: transactionCount};
        }).catch(function(err){
            return {status: 'error', message: err.message};
        });
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
};


var self = AthleteUtility;