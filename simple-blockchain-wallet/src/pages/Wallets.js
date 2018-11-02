import React from "react";

import Navigation from "../components/Navigation";
import WalletsMenu from "../components/WalletsMenu";

// wallets list page
const Wallets = () => (
  <div className="Wallet">
    <Navigation />
    <div className="Wallet-wrapper">
      <WalletsMenu />
    </div>
  </div>
);

export default Wallets;
