import { Form, Notify, Button, Layout } from "zent";
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { postAuthRequest } from "../modules/auth/actions";

const { FormInputField, createForm } = Form;
const { Row, Col } = Layout;

// login form
export class Login extends PureComponent {
  static propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    postAuthRequest: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
  };

  submit = (values, zentForm) => {
    const { username, password } = values;
    this.props.postAuthRequest(username, password);
  };

  componentDidUpdate(prevProps) {
    if (this.props.auth.error) {
      Notify.error(this.props.auth.error);
    }

    if (this.props.auth.data.isAuthenticated) {
      Notify.success("Login successful!");
    }
  }

  render() {
    const { handleSubmit } = this.props;
    return (
      <Row>
        <Col span={8} offset={8}>
          <div className="Login">
            <h1>Login</h1>
            <Form vertical onSubmit={handleSubmit(this.submit)}>
              <FormInputField
                name="username"
                type="text"
                label="Username:"
                required
                validations={{
                  required: true
                }}
              />
              <FormInputField
                name="password"
                type="password"
                label="Password:"
                required
                validations={{
                  required: true
                }}
              />
              <div className="zent-form__form-actions">
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    );
  }
}
export default connect(
  ({ auth }) => ({ auth }),
  dispatch => ({
    postAuthRequest: (username, password) =>
      dispatch(postAuthRequest(username, password))
  })
)(createForm()(Login));
