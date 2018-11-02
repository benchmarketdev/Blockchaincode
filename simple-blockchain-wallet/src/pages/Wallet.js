import React, { Component } from "react";
import { Card, Layout, Notify } from "zent";

import PropTypes from "prop-types";
import { connect } from "react-redux";

// components
import Placeholder from "../components/Placeholder";

// actions
import { requestWalletAction } from "../modules/wallet/actions";

// selector
import Navigation from "../components/Navigation";

const { Row, Col } = Layout;

// Specific wallet page
export class Wallet extends Component {
  static propTypes = {
    getWalletRequest: PropTypes.func.isRequired,
    match: PropTypes.object.isRequired, // eslint-disable-line
    wallet: PropTypes.object.isRequired // eslint-disable-line
  };

  componentWillMount() {
    const { match } = this.props;

    this.props.getWalletRequest(match.params.id);
  }

  componentDidUpdate() {
    if (this.props.wallet.error) {
      Notify.error(this.props.wallet.error);
    }
  }

  renderWallet = () => {
    const { wallet } = this.props;
    return (
      !wallet.error && (
        <div className="Wallet">
          <Navigation />
          <div className="Wallet-content">
            <Row>
              <Col span={8}>
                <Card title={<div>Wallet Name: {wallet.label}</div>}>
                  <label className="Wallet-balance__label">
                    Wallet ID:{" "}
                    <span className="Wallet-balance__text"> {wallet.id}</span>
                  </label>
                  <label className="Wallet-balance__label">
                    Coin:{" "}
                    <span className="Wallet-balance__text"> {wallet.coin}</span>
                  </label>
                  <label className="Wallet-balance__label">
                    Balance:{" "}
                    <span className="Wallet-balance__text">
                      {" "}
                      {wallet.balance}
                    </span>
                  </label>
                  <label className="Wallet-balance__label">
                    Spendable Balance:{" "}
                    <span className="Wallet-balance__text">
                      {" "}
                      {wallet.spendableBalance}
                    </span>
                  </label>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      )
    );
  };

  renderLoading = () => (
    <div className="Wallet">
      <div className="Wallet-content">
        <Placeholder />
      </div>
    </div>
  );

  render() {
    return this.props.wallet.isLoading
      ? this.renderLoading()
      : this.renderWallet();
  }
}

export default connect(
  (state, ownProps) => {
    const { wallet } = state;
    const { match } = ownProps;
    return {
      wallet: wallet.data[match.params.id] || wallet.data
    };
  },
  dispatch => ({
    getWalletRequest: walletId => dispatch(requestWalletAction(walletId))
  })
)(Wallet);
