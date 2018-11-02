import React from "react";
import { Form } from "zent";
import { mount, shallow } from "enzyme";
import toJson from "enzyme-to-json";
import sinon from "sinon";

import { Login } from "../Login";

const { createForm } = Form;

describe("Login component", () => {
  const mockHandleSubmit = jest.fn();
  const mockPostAuthRequest = jest.fn();
  const mockAuth = {};
  const LoginForm = createForm()(() => (
    <Login
      handleSubmit={mockHandleSubmit}
      postAuthRequest={mockPostAuthRequest}
      auth={mockAuth}
    />
  ));

  it("Should match snapshot", () => {
    const component = mount(<LoginForm />);

    expect(toJson(component)).toMatchSnapshot();
  });

  // username and password
  it("Should contain username and password input", () => {
    const component = mount(<LoginForm />);
    expect(component.text()).toContain("Username");
    expect(component.text()).toContain("Password");
  });

  /* componentDidUpdate loads up notification
  * Notification for successful and failure of login attempt
  */
  // it("should call componentDidUpdate function", () => {
  //   sinon.spy(Login.prototype, "componentDidUpdate");
  //   expect(Login.prototype.componentDidUpdate.calledOnce).toBeTruthy();
  // });
});
