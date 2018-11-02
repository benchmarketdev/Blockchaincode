import React, { Component } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { requestWalletListAction } from "../modules/wallet/actions";
import Placeholder from "./Placeholder";
import loadingSelector from "../modules/loading/selector";

// show list of wallets of the authenticated user
export class WalletsMenu extends Component {
  static defaultProps = {
    walletList: [],
    loading: false
  };

  static propTypes = {
    getWalletListRequest: PropTypes.func.isRequired,
    walletList: PropTypes.array, // eslint-disable-line
    loading: PropTypes.bool
  };

  componentWillMount() {
    this.props.getWalletListRequest();
  }

  render() {
    const { walletList, loading } = this.props;
    return (
      <div className="Wallet-content">
        <h1>Wallet list:</h1>
        {loading ? (
          <Placeholder />
        ) : (
          <div className="Wallet-list">
            {walletList.map(wallet => (
              <div className="Wallet-list--item" key={wallet.id}>
                <Link
                  className="Wallet-list__link"
                  to={`/wallets/${wallet.id}`}
                >
                  {wallet.label}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

const walletListLoading = loadingSelector(["GET_WALLET_LIST"]);

export default connect(
  state => {
    const { wallet } = state;
    const mapWalletList = Object.keys(wallet.data).map(
      walletId => wallet.data[walletId]
    );
    return {
      walletList: mapWalletList,
      loading: walletListLoading(state)
    };
  },
  dispatch => ({
    getWalletListRequest: () => dispatch(requestWalletListAction())
  })
)(WalletsMenu);
