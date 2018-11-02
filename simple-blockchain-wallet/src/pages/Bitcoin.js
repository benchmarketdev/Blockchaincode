import React from "react";
import { Form, Button, Layout } from "zent";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Navigation from "../components/Navigation";
import { postSendBitcoinRequest, bitcoin } from "../modules/bitcoin/actions";
import { requestWalletListAction } from "../modules/wallet/actions";

const { FormInputField, createForm, FormSelectField } = Form;
const { Row, Col } = Layout;

// a page for sending bitcoin to other wallets
class Bitcoin extends React.PureComponent {
  static defaultProps = {
    walletList: []
  };

  static propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    postSendBitcoinRequest: PropTypes.func.isRequired,
    getWalletListRequest: PropTypes.func.isRequired,
    resetNotification: PropTypes.func.isRequired,
    walletList: PropTypes.array, // eslint-disable-line
    bitcoin: PropTypes.object.isRequired // eslint-disable-line
  };

  handleFormSubmit = values => {
    const { walletId, passphrase, destination, amount } = values;
    this.props.postSendBitcoinRequest(
      walletId,
      passphrase,
      destination,
      amount
    );
  };

  componentWillMount() {
    // resetting notifications
    this.props.resetNotification();
    this.props.getWalletListRequest();
  }

  render() {
    const { walletList, bitcoin } = this.props;
    return (
      <div className="Wallet">
        <Navigation />
        <div className="Wallet-content">
          {bitcoin.isLoading ? (
            <div>Processing...</div>
          ) : (
            <Row>
              {bitcoin.notification.success && (
                <div className="Notification success">
                  Success! You have successfully sent coins. Check your E-mail
                  for confirmation.
                </div>
              )}
              {bitcoin.notification.failure && (
                <div className="Notification failure">
                  Sending of bitcoin failed. Please try again.
                </div>
              )}
              <Col span={8} offset={8}>
                <Form
                  className="Wallet-form"
                  horizontal
                  onSubmit={this.props.handleSubmit(this.handleFormSubmit)}
                >
                  <FormSelectField
                    name="walletId"
                    label="Wallet ID: "
                    data={walletList}
                    required
                    validations={{ required: true }}
                    validationErrors={{
                      required: "Please choose the wallet ID."
                    }}
                  />
                  <FormInputField
                    name="passphrase"
                    type="password"
                    label="Wallet passphrase: "
                    required
                    spellCheck={false}
                    validations={{ required: true }}
                    validationErrors={{ required: "Please enter the value" }}
                  />
                  <FormInputField
                    name="destination"
                    type="text"
                    label="Recipient Address:"
                    required
                    spellCheck={false}
                    validations={{ required: true }}
                    validationErrors={{
                      required: "Please enter the wallet address."
                    }}
                  />
                  <FormInputField
                    name="amount"
                    type="number"
                    label="Amount: "
                    required
                    addonBefore="$"
                    spellCheck={false}
                    validations={{ required: true }}
                    validationErrors={{ required: "Please enter the value" }}
                  />

                  <div className="zent-form__form-actions">
                    <Button type="primary" htmlType="submit">
                      Send
                    </Button>
                  </div>
                </Form>
              </Col>
            </Row>
          )}
        </div>
      </div>
    );
  }
}

export default connect(
  state => {
    const { wallet, bitcoin } = state;
    return {
      walletList: Object.keys(wallet.data)
        .map(walletId => wallet.data[walletId])
        .map(wal => {
          return {
            ...wal,
            value: wal.id,
            text: wal.label
          };
        }, []),
      bitcoin: bitcoin.data || bitcoin
    };
  },
  dispatch => ({
    getWalletListRequest: () => dispatch(requestWalletListAction()),
    postSendBitcoinRequest: (walletId, walletPass, destination, amount) =>
      dispatch(
        postSendBitcoinRequest(walletId, walletPass, destination, amount)
      ),
    resetNotification: () => dispatch(bitcoin.resetSendBitcoinNotification())
  })
)(createForm()(Bitcoin));
