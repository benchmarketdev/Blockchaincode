const express = require("express");

const app = express();
const BitGoJS = require("bitgo");
const bodyParser = require("body-parser");
const cors = require("cors");
const errorhandler = require("errorhandler");

const PORT = 8000;
const isProduction = process.env.NODE_ENV === "production";
const API = "/api/v1";
// const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";
const ACCESS_TOKEN = "";
const bitgo = new BitGoJS.BitGo({
  env: "test"
  // accessToken: ACCESS_TOKEN
});

// cors
app.use(cors());

// body parser
app.use(bodyParser.json());

// development error handler
if (!isProduction) {
  app.use(errorhandler());
}

app.get(`${API}/`, (req, res) => res.send("Server is alive!"));

// authentication
app.get(`${API}/auth`, (req, res) =>
  bitgo
    .session({})
    .then(response => res.json(response))
    .catch(error => res.json({ error }))
);

// create wallet
app.post(`${API}/create`, (req, res, next) => {
  const { label, pass } = req.body;
  if (!label || pass) {
    return next("Invalid data");
  }
  bitgo
    .wallets()
    .createWalletWithKeychains({ passphrase: pass, label }, (err, result) => {
      if (err) {
        return next("Error creating wallet!");
      }
      return res.json({
        walletId: result.wallet.id(),
        data: result.wallet.wallet
      });
    });
});

// get wallet info
app.post(`${API}/wallet-info`, (req, res, next) => {
  const { address } = req.body;
  if (!address) {
    return next("unable to fetch data.");
  }

  bitgo
    .coin("tbtc")
    .wallets()
    .get({ id: address })
    .then(wallet => {
      return res.json({
        wallet: wallet._wallet
      });
    })
    .catch(error => next(error));
});

// get wallet-list
app.post(`${API}/wallet-list`, (req, res, next) => {
  bitgo
    .coin("tbtc")
    .wallets()
    .list({})
    .then(wallets => {
      return res.json({
        wallets: wallets
      });
    })
    .catch(error => next(error));
});

// sending bitcoin
app.post(`${API}/send`, (req, res, next) => {
  const { walletId, walletPass, destination, amount } = req.body;
  if (!walletId || !walletPass || !destination || !amount) {
    return next("unable to send bitcoin.");
  }

  bitgo
    .coin("tbtc")
    .wallets()
    .get({ id: walletId })
    .then(wallet => {
      // unlock bitgo session first to send
      unlockBitcoin();
      return wallet
        .send({ amount, address: destination, walletPassphrase: walletPass })
        .then(transaction => {
          // print transaction details
          console.dir(transaction);
          return res.json({
            transaction
          });
        })
        .catch(error => next(error));
    })
    .catch(error => {
      console.log(error);
      console.log("error here");
      return next(error);
    });
});

// login
app.post(`${API}/login`, (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return next("unable to login.");
  }

  bitgo
    .authenticate({
      username: username,
      password: password,
      otp: "0000000"
    })
    .then(response => {
      var token = response.token;
      var user = response.user;
      // etc
      return res.json({
        user: response
      });
    })
    .catch(err => next(err));
});

app.post(`${API}/logout`, (req, res, next) => {
  bitgo
    .logout({})
    .then(response => {
      // the user is now logged out
      return res.status(200).end();
    })
    .catch(error => next(error));
});

app.post(`${API}/unlock`, (req, res, next) => {
  bitgo.unlock({ otp: "0000000" }).then(unlockResponse => {
    return res.json({
      response: unlockResponse
    });
  });
});

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    console.log(err);

    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  });
});

// utility
const unlockBitcoin = () => {
  return bitgo
    .unlock({ otp: "0000000" })
    .then(unlockResponse => {
      console.log(unlockResponse);
    })
    .catch(error => {
      return next(error);
    });
};

app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
