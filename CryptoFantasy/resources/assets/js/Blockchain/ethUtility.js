var Web3 = require('web3');
var SolidityFunction = require('web3').SolidityFunction;
var BigNumber = require('bignumber.js');
var xss = require('xss');
var config = require('./config/config.json');
export var ethUtility = {
    weiToEth : function(weiIn, divisorIn, fixIn) {
		var fix = fixIn || 3;
        var wei = new BigNumber(String(weiIn));
		var	divisor = new BigNumber(divisorIn ? divisorIn : 1e18);
		return fixIn ? wei.div(divisor).toNumber().toFixed(fix) : wei.div(divisor);
	},
	ethToWei : function(ethIn, divisorIn, ceil) {
		var eth = new BigNumber(String(ethIn));
        var divisor = new BigNumber(divisorIn ? divisorIn : 1e18);
		return ceil ? eth.times(divisor).ceil() : eth.times(divisor).floor();
	},
	roundToNearest : function(numToRound, numToRoundToIn) {
		var numToRoundTo = 1 / numToRoundToIn;
		return Math.round(numToRound * numToRoundTo) / numToRoundTo;
	},
	getURL : function(url, callback, options) {
		$.get(url, options, function(err, httpResponse, body) {
            callback(void 0, body.responseText);
			// err ? callback(err, void 0, void 0) : callback(void 0, httpResponse.responseText);
		});
	},
	postURL : function(url, formData, callback) {
		$.post({ url: url, form: formData }, function(err, httpResponse, body) {
			err ? callback(err, void 0) : callback(void 0, xss(sanitizer.sanitize(body)));
		});
    },
    getContract : function(web3, contractAddress, callback) {
        $.getJSON('http://api.etherscan.io/api?module=contract&action=getabi&address='+contractAddress, function (data) {
            var contractABI = "";
console.log(data);
            contractABI = JSON.parse(data.result);
            if (contractABI != '') {
                var _Contract = web3.eth.contract(contractABI);
                var contractInstance = _Contract.at(contractAddress);
                callback(contractInstance)
            } else {
                callback("Error");
            }            
        });
    },
    getNextNonce : function(web3, address, callback) {
        var url = "https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionCount&address=" + address + "&tag=latest";
        config.etherscanApiKey && (url += "&apikey=" + config.etherscanApiKey);
        utility.getURL(url, function(err, body) {
            if (err) callback(err, void 0);
            else {
                var result = JSON.parse(body),
                    nextNonce = Number(result.result);
                callback(void 0, nextNonce)
            }
        });
    },
    send : function(web3, contract, _address, functionName, argsIn, fromAddress, privateKeyIn, nonceIn, callback) {
		function encodeConstructorParams(abi, params) {
			return abi.filter(function(json) {
				return "constructor" === json.type && json.inputs.length === params.length
			}).map(function(json) {
				return json.inputs.map(function(input) {
					return input.type
				})
			}).map(function(types) {
				return coder.encodeParams(types, params)
			})[0] || ""
		}
		var privateKey = privateKeyIn && "0x" === privateKeyIn.substring(0, 2) ? privateKeyIn.substring(2, privateKeyIn.length) : privateKeyIn;
        options = {};
		// "object" === _typeof(args[args.length - 1]) && args[args.length - 1].gas && (args[args.length - 1].gasPrice = args[args.length - 1].gasPrice || config.ethGasPrice, args[args.length - 1].gasLimit = args[args.length - 1].gas, delete args[args.length - 1].gas), utils.isObject(args[args.length - 1]) && (options = args.pop()),
	    utility.getNextNonce(web3, fromAddress, function(err, nextNonce) {
			var nonce = nonceIn;
			if (contract && functionName) {
				options.to = _address;
				var inputTypes = contract.abi.find(function(element) {
						return element.name == functionName
					}).inputs.map(function(x) {
						return x.type
					}),
					typeName = inputTypes.join();
				options.data = "0x" + sha3(functionName + "(" + typeName + ")").slice(0, 8) + coder.encodeParams(inputTypes, args)
			} else options.to = _address;
			try {
				var post = function(serializedTx) {
					var url = "https://api.etherscan.io/api";
                    var formData = {module: "proxy",action: "eth_sendRawTransaction",hex: serializedTx};
					formData.apikey = config.etherscanApiKey;
	                utility.postURL(url, formData, function(errPostURL, body) {
						if (errPostURL) callback(errPostURL, {
							txHash: void 0,
							nonce: nonce
						});
						else try {
							var result = JSON.parse(body);
							result.result ? callback(void 0, {
								txHash: result.result,
								nonce: nonce + 1
							}) : result.error && callback(result.error.message, {
								txHash: void 0,
								nonce: nonce
							})
						} catch (errTry) {
							callback(errTry, {
								txHash: void 0,
								nonce: nonce
							})
						}
					});
				};
				if (privateKeyIn) {
					var _tx = new Tx(options);
					utility.signTx(web3, fromAddress, _tx, privateKey, function(errSignTx, txSigned) {
						if (errSignTx) console.log(err), callback("Failed to sign transaction", {
							txHash: void 0,
							nonce: nonce
						});
						else {
							var serializedTx = txSigned.serialize().toString("hex");
							post(serializedTx)
						}
					});
				} else callback("Failed to sign transaction", {
					txHash: void 0,
					nonce: nonce
				})
			} catch (errCatch) {
				callback(errCatch, {
					txHash: void 0,
					nonce: nonce
				})
			}
		})
    },
	call : function(web3In, contract, address, functionName, args, callback) {
        var web3 = new Web3;
        var data = contract[functionName].getData.apply(null, args);
        var url = "https://api.etherscan.io/api?module=proxy&action=eth_Call&to=" + address + "&data=" + data+"&apikey=" + config.etherscanApiKey;
        utility.getURL(url, function(err, body) {
            // if (err) callback(err, void 0);
            // else {
            //     try {
                    var result = JSON.parse(body);
                    var functionAbi = contract.abi.find(function(element) {
                        return element.name == functionName
                    });         
                    // console.log(functionAbi);
                    var unsafeResult = new SolidityFunction(web3.eth, functionAbi, address).unpackOutput(result.result);
                    // console.log('unsafeResult', unsafeResult);
                    var safeResult = xss(sanitizer.sanitize(unsafeResult));
                    var finalResult = "BigNumber" === unsafeResult.constructor.name ? new BigNumber(safeResult) : safeResult;

                    callback(void 0, finalResult)
            //     } catch (errJson) {
            //         callback(err, void 0);
            //     }
            // }
        });
	},
	signTx : function(web3, address, txIn, privateKey, callback) {
		var tx = txIn;
		if (privateKey) tx.sign(new Buffer(privateKey, "hex")), callback(void 0, tx);
		else {
			var msgHash = "0x" + tx.hash(!1).toString("hex");
			web3.eth.sign(address, msgHash, function(err, sigResult) {
				if (err) callback(err, void 0);
				else try {
					var r = sigResult.slice(0, 66),
						s = "0x" + sigResult.slice(66, 130),
						v = web3.toDecimal("0x" + sigResult.slice(130, 132));
					27 !== v && 28 !== v && (v += 27), tx.r = r, tx.s = s, tx.v = v, callback(void 0, tx)
				} catch (errTry) {
					callback(errTry, void 0)
				}
			})
		}
	}
};
let utility = ethUtility;