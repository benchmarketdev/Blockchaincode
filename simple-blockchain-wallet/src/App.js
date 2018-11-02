import React from "react";
import { Route, Switch } from "react-router-dom";

import Home from "./pages/Home";
import Wallets from "./pages/Wallets";
import Wallet from "./pages/Wallet";
import PageError from "./pages/PageError";

import Bitcoin from "./pages/Bitcoin";
import PrivateRoute from "./components/PrivateRoute";

const App = () => (
  <main className="App">
    <Switch>
      <Route exact path="/" component={Home} />
      <PrivateRoute exact path="/wallets" component={Wallets} />
      <PrivateRoute exact path="/wallets/send" component={Bitcoin} />
      <PrivateRoute exact path="/wallets/:id" component={Wallet} />
      <Route component={PageError} />
    </Switch>
  </main>
);

export default App;
