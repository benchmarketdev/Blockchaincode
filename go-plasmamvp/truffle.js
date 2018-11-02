const infuraApikey = 'PA0g0wLEd5abqZ9Tdulx';
const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = 'rapid favorite result enough ivory blood search educate oak multiply add raven';

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 500,
    }
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraApikey}`);
      },
      network_id: 3,
      gas: 4075039, // default = 4712388
      gasPrice: 35000000000 // default = 100 gwei = 100000000000
    },
  }
};

