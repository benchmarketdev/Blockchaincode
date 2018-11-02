// var Web3 = require('web3');
var Web3 = require('./web3.min.js');
var ethUtil = require('ethereumjs-util');
var BigNumber = require('bignumber.js');
var Buffer = require('buffer').Buffer;
var Tx = require('ethereumjs-tx');
var lightWallet = require('eth-lightwallet');
var coder = require('web3/lib/solidity/coder');
var CryptoJS = require('crypto-js');

var txUtils = lightWallet.txutils;

var ethContracts = require('ethereum-contracts');
// var truffleContract = require('truffle-contract');
// var ethers = require('ethers');

var config = require('./config/config.json');
var utility = require('./ethUtility.js').ethUtility;
var contractABI = require('./contracts/AthleteToken.json');
var _bytecode = require('./contracts/AthleteToken.bytecode.json');
var ethUtils = {};
var address = "0xBFe96b35E3E08d4ABe6a9022b2363922092A4751";
var privateKey = "0d97d178c437c3c7bda56e17c606d59bc1562b5af43f8ea298f78e92ea573a75";
var _contractAddress = '0xCE5b4AcC8B14F2421A9682004134397E83A99454'; 

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
        self.web3 = new Web3(new Web3.providers.HttpProvider(config.ethTestProvider));
        var version = self.web3.version.api; 
console.log(self.web3);
    },
    setConfig : function() {
        self.contractABI = contractABI;
        self.contractByteCode = _bytecode.bytecode;

        self.contractAddress = config.contractAddress;
        self.privateKey = "0d97d178c437c3c7bda56e17c606d59bc1562b5af43f8ea298f78e92ea573a75";
        
        var contract = new self.web3.eth.Contract(self.contractABI)//.at(self.contractAddress);
        
        // self.deployContract('0xBFe96b35E3E08d4ABe6a9022b2363922092A4751', '0d97d178c437c3c7bda56e17c606d59bc1562b5af43f8ea298f78e92ea573a75');
    },
    initContract : function() {
console.log(utility);
        // self.web3.eth.contract(self.contractABI).at(self.contractAddress).then(function(instance){
        //     self.Athlete = instance;
        //     console.log(self.Athlete);
        // });
        utility.getContract(self.web3, _contractAddress, function(resultContract){
            if ( typeof resultContract == 'string' ) {
                console.log("Error");
                return;
            }
            self.contractInstance = resultContract;
            console.log(self.contractInstance);
            // utility.call(self.web3, self.contractInstance, self.contractAddress, 'totalSupply', [ {
            //     gas: 21000000000,
            //     gasPrice: 200000,
            //     value: 0
            // }], function(result){
            //     console.log(result);
            // });
        });         
        
    },
    createAthleteToToken: function( athlete_info ) {
        var _athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice;
        _athleteId = athlete_info.athleteId;
        _originWalletId = athlete_info.originWalletId;
        _actualFee = athlete_info.actualFee;
        _siteFee = athlete_info.siteFee;
        _sellPrice = self.web3.utils.toWei(athlete_info.sellPrice);

        var _privateKey = new Buffer(privateKey, 'hex');
        var functionName = 'createContractOfAthlete';

        // utility.send(web3, contract, _address, functionName, argsIn, fromAddress, privateKeyIn, nonceIn, function(err, result){
        //     console.log(err, result);
        // });
        // const Web3 = require('web3')  
        // let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/rQ1X4yW5eD5V5chmNUs3'));
        // let contract = web3.eth.contract(contractABI).at(self.contractAddress)  
        // var coder = require('web3/lib/solidity/coder')  
        // var CryptoJS = require('crypto-js')  
        // var _privateKey = new Buffer(privateKey, 'hex')  

        var functionName = 'createContractOfAthlete'  
        var types = ['string', 'address', 'uint256', 'uint256', 'uint256'];
        var args  = [_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice];
console.log(args);
        var fullName = functionName + '(' + types.join() + ')';
        var signature = CryptoJS.SHA3(fullName, {outputLength:256}).toString(CryptoJS.enc.Hex).slice(0,8)
        var dataHex = signature + coder.encodeParams(types, args);
        var data = '0x' + dataHex; 
        var nonce = self.web3.utils.toHex(1)  ;
        var gasPrice = self.web3.utils.toHex(66000000000)  
        var gasLimitHex = self.web3.utils.toHex(300000) 
        var rawTx = { 'nonce': nonce, 'gasPrice': gasPrice, 'gasLimit': gasLimitHex, 'from': address, 'to': self.contractAddress, 'data': data}  
console.log(self.web3);
        var tx = new Tx(rawTx)  
        tx.sign(_privateKey)  
        var serializedTx = '0x'+tx.serialize().toString('hex')  
//         $.post(config.ethTestProvider+'/eth_sendRawTransaction', {params: serializedTx}, function(result){
// console.log(result);
//         });
        var transaction = {from: address, to: self.contractAddress, nonce: 0x07, data: data, gas: 2000000, gasPrice: 21000000000, chainId: 3};
        var _key = "0x"+privateKey;
        var signed = self.web3.eth.signTransaction(transaction, _key);
console.log(transaction, signed);
        // self.web3.eth.sendTransaction(transaction, function(err, txHash){ console.log(err, txHash) });
        self.web3.eth.sendSignedTransaction(serializedTx).then(function(result){
console.log(result);
        });
    },
    
    getTransactionCount: function(_address) {
        self.web3.eth.getTransactionCount(_address).then(function(transactionCount) {
            alert(transactionCount);
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