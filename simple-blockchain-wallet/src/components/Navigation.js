import React, { Component } from "react";
import { Layout, Button } from "zent";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import { isAuthenticated } from "../utils";
import { postUnauthRequest } from "../modules/auth/actions";

const { Row, Col } = Layout;

// navigation menu
export class Navigation extends Component {
  static propTypes = {
    postUnauthRequest: PropTypes.func.isRequired // eslint-disable-line
  };

  state = {
    user: {}
  };

  render() {
    const { state, props } = this;
    return (
      <div className="Navigation theme-primary-2">
        <Row>
          <Col span={12}>
            <Link to={`${isAuthenticated() ? "/wallets" : "/"}`}>
              <h1>Simple blockchain wallet</h1>
            </Link>
          </Col>
          <Col span={12}>
            {isAuthenticated() && (
              <div className="Navigation-user">
                <Link to="/wallets/send">Send Bitcoin</Link>
                <Link to="/wallets">Wallets</Link>
                <span>{state.user.username}</span>
                <Button type="danger" outline onClick={props.postUnauthRequest}>
                  Logout
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </div>
    );
  }
}

export default connect(
  ({ auth }) => ({ auth }),
  dispatch => ({
    postUnauthRequest: () => dispatch(postUnauthRequest())
  })
)(Navigation);
