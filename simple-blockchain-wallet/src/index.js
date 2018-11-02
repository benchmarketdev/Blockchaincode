import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router";
import "zent/css/index.css";

import registerServiceWorker from "./registerServiceWorker";

import App from "./App";
import store, { history } from "./store";

// styles
import "./styles/index.css";
import "./styles/App.css";
import "./styles/Login.css";
import "./styles/Navigation.css";
import "./styles/Wallet.css";
import "./styles/Error-page.css";
import "./styles/Notification.css";

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById("root")
);

registerServiceWorker();
