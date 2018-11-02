var Web3 = require('web3');
var ethUtil = require('ethereumjs-util');
var BigNumber = require('bignumber.js');
//var ethContracts = require('ethereum-contracts');
var truffleContract = require('truffle-contract');
var ethers = require('ethers');

var config = require('./config/config.json');
var contractABI = require('./contracts/AthleteToken.json');
var _bytecode = require('./contracts/AthleteToken.bytecode.json');
AthleteUtility = {
    contractABI: null,
    web3: null,
    connected_ipc: '',
    userWalletId: '',
    contracts: {},
    provider: null,
    factory: null,
    adminPrivateKey: '0x107151f3df2a2b4960f584d12de8c1a82ea8259e229e1c2b140fdfd3b4d58c88',

    init : function() {
        this.loadWeb3();
        this.setConfig();
        this.initContract();
        this.getUserWalletId();
    },
    loadWeb3 : function() {
        if (window.web3 && typeof window.web3 !== 'undefined') {
            this.web3 = window.web3;
            this.connected_ipc = "MetaMask";
        }
        else if ("https:" !== window.location.protocol) {
            this.web3 = new Web3(new Web3.providers.HttpProvider(config.ethMainProvider+"/"+config.infura_main_token));
            this.connected_ipc = config.ethProvider;
        }
        else {
            console.log("Connecting to Etherscan proxy"), this.web3 = new Web3
        }
    },
    setConfig: function() {
        self.contractABI = contractABI;
        self.contractAddress = config.contractAddress;
        //self.provider = new ethers.providers.EtherscanProvider(config.etherscanNetwork, config.etherscanApiKey);
        self.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    },
    initContract : function() {

//        var Web3 = require('web3');
//        var web3 = new Web3(new Web3.providers.HttpProvider());
//        var version = web3.version.api;
//        web3.currentProvider = self.provider;
//console.log(web3);
//        $.getJSON('http://api.etherscan.io/api?module=contract&action=getabi&address='+self.contractAddress, function (data) {
//            var contractABI = "";
//            contractABI = JSON.parse(data.result);
//            if (contractABI != ''){
//                var MyContract = web3.eth.contract(contractABI);
//                var myContractInstance = MyContract.at('0xe1923998E3A63b75D84d8DFaE1F1Ea4E319B3341');
//                console.log(myContractInstance.ceoAddress());
//console.log(MyContract, myContractInstance);
//            } else {
//                console.log("Error" );
//            }
//        });
//        return;
        //self.contracts.Athlete = self.web3.eth.contract(contractABI).at(self.contractAddress);
        //self.web3.eth.defaultAccount = '0xe1923998E3A63b75D84d8DFaE1F1Ea4E319B3341';
        //console.log(self.web3.eth.defaultAccount);

        //address = '0xe1923998E3A63b75D84d8DFaE1F1Ea4E319B3341';
//        privateKey = '0x316d4e6a0e8cd6405110c817d8fb3c6a4be1f4958bb90599b3dcc239400dd9bd';
//console.log(self.provider)
        var wallet = new ethers.Wallet(self.adminPrivateKey, self.provider);
        self.contracts.Athlete = new ethers.Contract(self.contractAddress, self.contractABI, wallet);
//console.log(_bytecode);
//        var deployTransaction = ethers.Contract.getDeployTransaction(_bytecode.bytecode, contractABI);
//        //var provider = self.provider.getDefaultProvider();
//        var sendPromise = wallet.sendTransaction(deployTransaction);
//
//// Get the transaction
//        sendPromise.then(function(transaction) {
//            console.log("TRANSACTION DATA");
//            console.log(transaction);
//        });

console.log(wallet);
console.log(self.contracts.Athlete);
//        var balancePromise = self.provider.getBalance('0x6C3c39D9B50135e618709b411A979fc8B7359ceb');
//        var gasPricePromise = self.provider.getGasPrice();
//        var transactionCountPromise = self.provider.getTransactionCount('0x6C3c39D9B50135e618709b411A979fc8B7359ceb');
//console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
//        self.contracts.Athlete.connect(self.provider);
//console.log(ethers);
//
        var ceoAddress = self.contracts.Athlete.ceoAddress();
        var totalSupply = self.contracts.Athlete.totalSupply();
        var name = self.contracts.Athlete.name();
        var allPromises = Promise.all([
            totalSupply,
            ceoAddress,
            name
        ]);
        allPromises.then(function(results){
            var totalSupply = results[0];
            var ceoAddress = results[1][0];
            var name = results[2][0];
            console.log(totalSupply.toString(), ceoAddress, name);
        });
        //this.contracts.Athlete.ceoAddress().then(function(result){
        //    console.log(result[0])
        //});
        //this.contracts.Athlete.deployed().then(function(result){
        //    console.log(result);
        //}).catch(function(err){
        //    console.log(err)
        //});
//console.log(contract);
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


//        var _contract = self.web3.eth.contract(self.contractABI).at(self.contractAddress);
//        _contract.createContractOfAthlete(_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice).then(function(result){
//            console.log(result);
//        }).catch(function(err){
//            console.log(err);
//        });
//console.log(_contract);
//        alert(_originWalletId)
//        console.log(99,self.contracts.Athlete);


        var overrideOptions = {
            gasLimit: 250000,
            gasPrice: 3000000000,
            nonce: 0,
            value: ethers.utils.parseEther('1.0')
        };
        createTokenPromise = self.contracts.Athlete.createContractOfAthlete(_athleteId, _originWalletId, _actualFee, _siteFee, _sellPrice);
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