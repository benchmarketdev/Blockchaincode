# simple-blockchain-wallet
A simple blockchain wallet using BITGO SDK

## Installation

Before you install this project, make sure to create your own account at [BITGO](https://test.bitgo.com/info/signup) and create your `ACCESS_TOKEN` there.

```
$ npm install
$ npm run server // run node server
$ npm start // run react client
```

### How to
After creating your account at [BITGO](https://test.bitgo.com/info/signup) , You should be able to login with your account.

### References
This bitcoin wallet uses [BITGO](https://www.bitgo.com/info/).
For API documentation, checkout [BITGO SDK](https://bitgo.github.io/bitgo-docs/#software-development-kit).

### Note
Make sure to create an account at [BITGO](https://test.bitgo.com/info/signup) (test.bitgo) before running the app.
These repo is only geting *tbtc* bitcoin data. Wallet should also be new version of Bitgo wallet.

### Access Token limitation
Access tokens are used to maintain a session and are created via password login (requires OTP).
Typical access tokens obtained via the web interface are locked to a single IP-address and are valid for 60 minutes, although developers may create long lasting tokens.
With this, you can restart the node server. (`npm run server`)
